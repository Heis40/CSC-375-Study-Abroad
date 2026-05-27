import React, { useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { api } from './src/api/client';

const Stack = createNativeStackNavigator();

function Button({ title, onPress, type = 'primary' }) {
  return (
    <TouchableOpacity style={[styles.button, type === 'secondary' && styles.buttonSecondary]} onPress={onPress}>
      <Text style={[styles.buttonText, type === 'secondary' && styles.buttonTextSecondary]}>{title}</Text>
    </TouchableOpacity>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function AuthScreen({ navigation, setSession }) {
  const [mode, setMode] = useState('signup');
  const [fullName, setFullName] = useState('Aoife Murphy');
  const [county, setCounty] = useState('Cork');
  const [email, setEmail] = useState('aoife@example.com');
  const [password, setPassword] = useState('demo123');

  const submit = async () => {
    try {
      const payload = mode === 'signup'
        ? { fullName, county, email, password }
        : { email, password };

      const auth = mode === 'signup' ? await api.signup(payload) : await api.login(payload);
      setSession({ farmerId: auth.farmerId, token: auth.token, fullName: auth.fullName });
      navigation.replace('MapFarm');
    } catch (error) {
      Alert.alert('Authentication failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>SmartFarm</Text>
        <Text style={styles.subtitle}>Small & new farmer land management prototype</Text>

        <Card title={mode === 'signup' ? 'Create Account' : 'Login'}>
          {mode === 'signup' && (
            <>
              <TextInput value={fullName} onChangeText={setFullName} style={styles.input} placeholder="Full Name" />
              <TextInput value={county} onChangeText={setCounty} style={styles.input} placeholder="County" />
            </>
          )}
          <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" autoCapitalize="none" />
          <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />
          <Button title={mode === 'signup' ? 'Sign Up' : 'Login'} onPress={submit} />
          <Button
            title={mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign up'}
            onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            type="secondary"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function MapFarmScreen({ navigation, session, farmId, setFarmId, setLastFieldId }) {
  const [farmName, setFarmName] = useState('Murphy Family Farm');
  const [farmArea, setFarmArea] = useState('24');
  const [fieldName, setFieldName] = useState('North Rough Grazing');
  const [landUseType, setLandUseType] = useState('rough-grazing');
  const [points, setPoints] = useState([]);

  const onMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { latitude, longitude }]);
  };

  const polygonWkt = useMemo(() => {
    if (points.length < 3) return '';
    const closed = [...points, points[0]];
    const text = closed.map((p) => `${p.longitude} ${p.latitude}`).join(', ');
    return `POLYGON((${text}))`;
  }, [points]);

  const saveField = async () => {
    try {
      if (points.length < 3) {
        Alert.alert('Need more points', 'Tap at least 3 points on the map.');
        return;
      }

      let activeFarmId = farmId;
      if (!activeFarmId) {
        const farm = await api.createFarm({
          farmerId: session.farmerId,
          name: farmName,
          county: 'Cork',
          totalAreaHa: Number(farmArea || 1),
        });
        activeFarmId = farm.id;
        setFarmId(activeFarmId);
      }

      const field = await api.createField({
        farmId: activeFarmId,
        name: fieldName,
        landUseType,
        polygonWkt,
        areaHa: Number(farmArea || 1) / 2,
      });

      setLastFieldId(field.id);
      Alert.alert('Saved', 'Farm and field mapping saved.');
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert('Save failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Map Farm</Text>

        <Card title="Farm Setup">
          <TextInput value={farmName} onChangeText={setFarmName} style={styles.input} placeholder="Farm Name" />
          <TextInput value={farmArea} onChangeText={setFarmArea} style={styles.input} placeholder="Total Area (ha)" keyboardType="numeric" />
          <TextInput value={fieldName} onChangeText={setFieldName} style={styles.input} placeholder="Field Name" />
          <TextInput value={landUseType} onChangeText={setLandUseType} style={styles.input} placeholder="Land Use (pasture, crops, rough-grazing)" />
        </Card>

        <Card title="Tap map to draw field boundary">
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 52.668, longitude: -8.63, latitudeDelta: 0.09, longitudeDelta: 0.09 }}
            onPress={onMapPress}
          >
            {points.map((p, index) => <Marker key={`${p.latitude}-${p.longitude}-${index}`} coordinate={p} />)}
            {points.length >= 3 && <Polygon coordinates={points} fillColor="rgba(34,197,94,0.3)" strokeColor="#166534" strokeWidth={2} />}
          </MapView>
          <Text style={styles.smallText}>Points: {points.length}</Text>
          <Text style={styles.smallText}>Polygon WKT preview: {polygonWkt || 'Add at least 3 points...'}</Text>
          <Button title="Clear Points" type="secondary" onPress={() => setPoints([])} />
          <Button title="Save & Continue" onPress={saveField} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardScreen({ navigation, farmId }) {
  const [dashboard, setDashboard] = useState(null);

  const load = async () => {
    try {
      if (!farmId) return;
      const data = await api.getDashboard(farmId);
      setDashboard(data);
    } catch (error) {
      Alert.alert('Dashboard error', error.message);
    }
  };

  React.useEffect(() => {
    load();
  }, [farmId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dashboard</Text>

        <Card title="Core Indicators">
          <Text style={styles.metric}>Vegetation health (NDVI): {dashboard?.vegetationHealthScore?.toFixed?.(2) ?? '-'}</Text>
          <Text style={styles.metric}>Soil status: {dashboard?.soilStatus ?? '-'}</Text>
          <Text style={styles.metric}>Livestock-land ratio: {dashboard?.livestockLandBalance?.toFixed?.(2) ?? '-'}</Text>
          <Text style={styles.metric}>Mapped fields: {dashboard?.activeFields ?? 0}</Text>
          <Button title="Refresh" type="secondary" onPress={load} />
        </Card>

        <Card title="Workflow">
          <Button title="Recommendations" onPress={() => navigation.navigate('Recommendations')} />
          <Button title="Planning Tools" onPress={() => navigation.navigate('PlanningTools')} />
          <Button title="Scheme Support" onPress={() => navigation.navigate('SchemeSupport')} />
          <Button title="Monitoring" onPress={() => navigation.navigate('Monitoring')} />
          <Button title="Seasonal Reports" onPress={() => navigation.navigate('SeasonalReports')} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecommendationsScreen({ farmId }) {
  const [data, setData] = useState(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        if (!farmId) return;
        setData(await api.getRecommendations(farmId));
      } catch (error) {
        Alert.alert('Recommendation error', error.message);
      }
    };
    run();
  }, [farmId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recommendations</Text>
        <Card title="Crop Diversification Suggestions">
          {(data?.cropDiversificationSuggestions ?? []).map((item, idx) => (
            <Text key={idx} style={styles.listItem}>• {item}</Text>
          ))}
        </Card>
        <Card title="Rough Grazing Optimization">
          {(data?.grazingOptimizationSuggestions ?? []).map((item, idx) => (
            <Text key={idx} style={styles.listItem}>• {item}</Text>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanningToolsScreen() {
  const [units, setUnits] = useState('18');
  const [area, setArea] = useState('12');
  const [result, setResult] = useState(null);

  const calculate = async () => {
    try {
      const data = await api.calculateBalance({
        totalLivestockUnits: Number(units),
        totalGrazingAreaHa: Number(area),
      });
      setResult(data);
    } catch (error) {
      Alert.alert('Calculator error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Planning Tools</Text>
        <Card title="Livestock-Land Balance Calculator">
          <TextInput value={units} onChangeText={setUnits} style={styles.input} placeholder="Total Livestock Units" keyboardType="numeric" />
          <TextInput value={area} onChangeText={setArea} style={styles.input} placeholder="Total Grazing Area (ha)" keyboardType="numeric" />
          <Button title="Calculate" onPress={calculate} />
          {result && (
            <>
              <Text style={styles.metric}>Ratio: {result.ratio.toFixed(2)}</Text>
              <Text style={styles.metric}>Status: {result.status}</Text>
              <Text style={styles.smallText}>{result.guidance}</Text>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function SchemeSupportScreen({ session }) {
  const [programs, setPrograms] = useState([]);

  React.useEffect(() => {
    const run = async () => {
      try {
        setPrograms(await api.getPrograms());
      } catch (error) {
        Alert.alert('Programs error', error.message);
      }
    };
    run();
  }, []);

  const apply = async (programId) => {
    try {
      await api.applyProgram(programId, session.farmerId);
      Alert.alert('Application submitted', 'Program application was submitted successfully.');
    } catch (error) {
      Alert.alert('Apply failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Scheme Support</Text>
        {programs.map((program) => (
          <Card key={program.id} title={program.name}>
            <Text style={styles.listItem}>{program.description}</Text>
            <Text style={styles.smallText}>Eligibility: {program.eligibility}</Text>
            <Button title="Apply" onPress={() => apply(program.id)} />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function MonitoringScreen({ lastFieldId }) {
  const [fieldId, setFieldId] = useState(lastFieldId ? String(lastFieldId) : '');
  const [data, setData] = useState(null);

  const fetchMonitoring = async () => {
    try {
      if (!fieldId) {
        Alert.alert('Missing field', 'Enter a field id.');
        return;
      }
      const response = await api.getMonitoring(Number(fieldId));
      setData(response);
    } catch (error) {
      Alert.alert('Monitoring error', error.message);
    }
  };

  React.useEffect(() => {
    if (lastFieldId) {
      setFieldId(String(lastFieldId));
    }
  }, [lastFieldId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Satellite Monitoring</Text>
        <Card title="NDVI Monitoring (Sample)">
          <TextInput value={fieldId} onChangeText={setFieldId} style={styles.input} placeholder="Field ID" keyboardType="numeric" />
          <Button title="Load NDVI" onPress={fetchMonitoring} />
          {(data?.points ?? []).map((point, idx) => (
            <Text key={idx} style={styles.listItem}>• {point.captureDate}: NDVI {point.ndvi} ({point.condition})</Text>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function SeasonalReportsScreen({ farmId }) {
  const [season, setSeason] = useState('Spring');
  const [report, setReport] = useState(null);

  const loadReport = async () => {
    try {
      if (!farmId) {
        Alert.alert('Missing farm', 'Map your farm first.');
        return;
      }
      setReport(await api.getSeasonalReport(farmId, season));
    } catch (error) {
      Alert.alert('Report error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Seasonal Reports</Text>
        <Card title="Generate Report">
          <TextInput value={season} onChangeText={setSeason} style={styles.input} placeholder="Season" />
          <Button title="Generate" onPress={loadReport} />
        </Card>

        {report && (
          <Card title={`${report.season} Summary`}>
            <Text style={styles.metric}>Vegetation: {report.dashboard.vegetationHealthScore.toFixed(2)}</Text>
            <Text style={styles.metric}>Soil: {report.dashboard.soilStatus}</Text>
            <Text style={styles.metric}>Balance: {report.dashboard.livestockLandBalance.toFixed(2)}</Text>
            <Text style={styles.cardTitle}>Yield Forecasts</Text>
            {(report.yieldForecasts ?? []).map((y) => (
              <Text key={y.id} style={styles.listItem}>• {y.cropType}: {y.predictedTons} tons ({Math.round(y.confidenceScore * 100)}% confidence)</Text>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [farmId, setFarmId] = useState(null);
  const [lastFieldId, setLastFieldId] = useState(null);

  const logout = (navigation) => {
    setSession(null);
    setFarmId(null);
    setLastFieldId(null);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={({ navigation, route }) => ({
          headerRight: route.name === 'Auth'
            ? undefined
            : () => (
              <TouchableOpacity style={styles.headerLogoutButton} onPress={() => logout(navigation)}>
                <Text style={styles.headerLogoutText}>Log Out</Text>
              </TouchableOpacity>
            ),
        })}
      >
        <Stack.Screen name="Auth" options={{ headerShown: false }}>
          {(props) => <AuthScreen {...props} setSession={setSession} />}
        </Stack.Screen>

        <Stack.Screen name="MapFarm" options={{ title: 'Map Farm' }}>
          {(props) => (
            <MapFarmScreen
              {...props}
              session={session}
              farmId={farmId}
              setFarmId={setFarmId}
              setLastFieldId={setLastFieldId}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Dashboard" options={{ title: 'Dashboard' }}>
          {(props) => <DashboardScreen {...props} farmId={farmId} />}
        </Stack.Screen>

        <Stack.Screen name="Recommendations" options={{ title: 'Recommendations' }}>
          {(props) => <RecommendationsScreen {...props} farmId={farmId} />}
        </Stack.Screen>

        <Stack.Screen name="PlanningTools" options={{ title: 'Planning Tools' }} component={PlanningToolsScreen} />

        <Stack.Screen name="SchemeSupport" options={{ title: 'Scheme Support' }}>
          {(props) => <SchemeSupportScreen {...props} session={session} />}
        </Stack.Screen>

        <Stack.Screen name="Monitoring" options={{ title: 'Monitoring' }}>
          {(props) => <MonitoringScreen {...props} lastFieldId={lastFieldId} />}
        </Stack.Screen>

        <Stack.Screen name="SeasonalReports" options={{ title: 'Seasonal Reports' }}>
          {(props) => <SeasonalReportsScreen {...props} farmId={farmId} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#334155',
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#166534',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#ecfccb',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#365314',
  },
  map: {
    width: '100%',
    height: 270,
    borderRadius: 10,
  },
  metric: {
    fontSize: 15,
    color: '#1e293b',
  },
  listItem: {
    color: '#1e293b',
    lineHeight: 20,
  },
  smallText: {
    fontSize: 12,
    color: '#64748b',
  },
  headerLogoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ecfccb',
  },
  headerLogoutText: {
    color: '#365314',
    fontWeight: '700',
    fontSize: 12,
  },
});
