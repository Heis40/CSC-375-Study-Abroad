package com.smartfarm.api;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PrototypeDataService {
    private final AtomicLong idGenerator = new AtomicLong(1);

    private final Map<Long, Farmer> farmers = new HashMap<>();
    private final Map<Long, Farm> farms = new HashMap<>();
    private final Map<Long, Field> fields = new HashMap<>();
    private final List<Crop> crops = new ArrayList<>();
    private final List<SoilHealth> soilHealths = new ArrayList<>();
    private final List<SatelliteMonitoring> monitorings = new ArrayList<>();
    private final List<Livestock> livestock = new ArrayList<>();
    private final List<YieldPrediction> predictions = new ArrayList<>();
    private final List<GovernmentProgram> programs = new ArrayList<>();
    private final List<GovernmentProgramApplication> programApplications = new ArrayList<>();

    public PrototypeDataService() {
        seedPrograms();
    }

    public AuthResponse signup(SignupRequest request) {
        Optional<Farmer> existing = farmers.values().stream()
                .filter(f -> f.email().equalsIgnoreCase(request.email()))
                .findFirst();
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        Long farmerId = idGenerator.getAndIncrement();
        Farmer farmer = new Farmer(farmerId, request.fullName(), request.email(), request.password(), request.county());
        farmers.put(farmerId, farmer);

        String token = buildMockToken(farmer);
        return new AuthResponse(farmer.id(), farmer.fullName(), token);
    }

    public AuthResponse login(LoginRequest request) {
        Farmer farmer = farmers.values().stream()
                .filter(f -> f.email().equalsIgnoreCase(request.email()) && f.password().equals(request.password()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        return new AuthResponse(farmer.id(), farmer.fullName(), buildMockToken(farmer));
    }

    public Farm createFarm(CreateFarmRequest request) {
        if (!farmers.containsKey(request.farmerId())) {
            throw new IllegalArgumentException("Farmer not found");
        }
        Long farmId = idGenerator.getAndIncrement();
        Farm farm = new Farm(farmId, request.farmerId(), request.name(), request.county(), request.totalAreaHa());
        farms.put(farmId, farm);
        return farm;
    }

    public Field createField(CreateFieldRequest request) {
        if (!farms.containsKey(request.farmId())) {
            throw new IllegalArgumentException("Farm not found");
        }

        Long fieldId = idGenerator.getAndIncrement();
        Field field = new Field(fieldId, request.farmId(), request.name(), request.landUseType(), request.polygonWkt(), request.areaHa());
        fields.put(fieldId, field);

        Crop crop = new Crop(idGenerator.getAndIncrement(), field.id(), "grass", "current");
        crops.add(crop);

        SoilHealth soil = new SoilHealth(idGenerator.getAndIncrement(), field.id(), LocalDate.now(), 6.3, 42, 18, 110, "Moderate");
        soilHealths.add(soil);

        SatelliteMonitoring monitoring = new SatelliteMonitoring(idGenerator.getAndIncrement(), field.id(), LocalDate.now(), 0.61, "Stable");
        monitorings.add(monitoring);

        YieldPrediction prediction = new YieldPrediction(idGenerator.getAndIncrement(), field.id(), "grass silage", "Spring", 16.2, 0.74);
        predictions.add(prediction);

        return field;
    }

    public Livestock addLivestock(AddLivestockRequest request) {
        if (!farms.containsKey(request.farmId())) {
            throw new IllegalArgumentException("Farm not found");
        }
        Livestock item = new Livestock(idGenerator.getAndIncrement(), request.farmId(), request.species(), request.headCount(), request.livestockUnits());
        livestock.add(item);
        return item;
    }

    public List<Field> getFieldsByFarm(Long farmId) {
        return fields.values().stream().filter(f -> f.farmId().equals(farmId)).toList();
    }

    public DashboardResponse getDashboard(Long farmId) {
        List<Field> farmFields = getFieldsByFarm(farmId);
        if (farmFields.isEmpty()) {
            return new DashboardResponse(0.0, "No soil data yet", 0.0, 0);
        }

        List<Long> fieldIds = farmFields.stream().map(Field::id).toList();

        double avgNdvi = monitorings.stream()
                .filter(m -> fieldIds.contains(m.fieldId()))
                .mapToDouble(SatelliteMonitoring::ndvi)
                .average()
                .orElse(0.0);

        String soilStatus = soilHealths.stream()
                .filter(s -> fieldIds.contains(s.fieldId()))
                .max(Comparator.comparing(SoilHealth::sampleDate))
                .map(SoilHealth::status)
                .orElse("Unknown");

        double totalLu = livestock.stream()
                .filter(l -> farms.get(farmId) != null && l.farmId().equals(farmId))
                .mapToDouble(Livestock::livestockUnits)
                .sum();

        double totalArea = farmFields.stream().mapToDouble(Field::areaHa).sum();
        double balance = totalArea == 0 ? 0 : totalLu / totalArea;

        return new DashboardResponse(avgNdvi, soilStatus, balance, farmFields.size());
    }

    public RecommendationResponse getRecommendations(Long farmId) {
        List<Field> farmFields = getFieldsByFarm(farmId);
        double totalArea = farmFields.stream().mapToDouble(Field::areaHa).sum();
        long roughGrazingFields = farmFields.stream().filter(f -> f.landUseType().equalsIgnoreCase("rough-grazing")).count();

        List<String> crop = new ArrayList<>();
        crop.add("Allocate 10-15% of arable area to spring barley for rotation resilience.");
        crop.add("Introduce a small horticulture pilot block (0.5-1.0 ha) near access routes.");
        if (totalArea > 20) {
            crop.add("Use a 3-year grass-cereal-clover rotation on larger fields.");
        }

        List<String> grazing = new ArrayList<>();
        grazing.add("Split rough grazing into rotational paddocks with rest periods of 25-30 days.");
        grazing.add("Target reseeding of lowest NDVI zones using clover-rich mixes.");
        if (roughGrazingFields > 0) {
            grazing.add("Prioritize liming on rough-grazing parcels to improve nutrient uptake.");
        }

        return new RecommendationResponse(crop, grazing);
    }

    public MonitoringResponse getMonitoring(Long fieldId) {
        List<SatelliteMonitoring> points = monitorings.stream()
                .filter(m -> m.fieldId().equals(fieldId))
                .sorted(Comparator.comparing(SatelliteMonitoring::captureDate))
                .toList();

        if (points.isEmpty()) {
            points = List.of(
                    new SatelliteMonitoring(idGenerator.getAndIncrement(), fieldId, LocalDate.now().minusDays(14), 0.52, "Moderate"),
                    new SatelliteMonitoring(idGenerator.getAndIncrement(), fieldId, LocalDate.now().minusDays(7), 0.57, "Improving"),
                    new SatelliteMonitoring(idGenerator.getAndIncrement(), fieldId, LocalDate.now(), 0.61, "Stable")
            );
            monitorings.addAll(points);
        }

        return new MonitoringResponse(fieldId, points);
    }

    public BalanceResponse calculateBalance(BalanceRequest request) {
        double ratio = request.totalLivestockUnits() / request.totalGrazingAreaHa();
        if (ratio <= 1.2) {
            return new BalanceResponse(ratio, "Balanced", "Stocking appears sustainable for current grazing area.");
        }
        if (ratio <= 1.6) {
            return new BalanceResponse(ratio, "Watch", "Reduce pressure with rotational grazing and supplementary forage.");
        }
        return new BalanceResponse(ratio, "Overstocked", "Lower stocking rate or increase forage area to reduce land pressure.");
    }

    public List<GovernmentProgram> getPrograms() {
        return programs;
    }

    public GovernmentProgramApplication applyToProgram(Long farmerId, Long programId) {
        if (!farmers.containsKey(farmerId)) {
            throw new IllegalArgumentException("Farmer not found");
        }
        boolean programExists = programs.stream().anyMatch(p -> p.id().equals(programId));
        if (!programExists) {
            throw new IllegalArgumentException("Program not found");
        }

        GovernmentProgramApplication application = new GovernmentProgramApplication(
                idGenerator.getAndIncrement(), farmerId, programId, "Submitted", LocalDate.now()
        );
        programApplications.add(application);
        return application;
    }

    public SeasonalReportResponse getSeasonalReport(Long farmId, String season) {
        DashboardResponse dashboard = getDashboard(farmId);
        RecommendationResponse recommendations = getRecommendations(farmId);

        List<Long> fieldIds = getFieldsByFarm(farmId).stream().map(Field::id).toList();
        List<YieldPrediction> yieldForecasts = predictions.stream()
                .filter(p -> fieldIds.contains(p.fieldId()))
                .toList();

        return new SeasonalReportResponse(farmId, season, dashboard, recommendations, yieldForecasts);
    }

    private String buildMockToken(Farmer farmer) {
        String payload = farmer.id() + ":" + farmer.email() + ":" + LocalDate.now();
        return "mock-jwt." + Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    private void seedPrograms() {
        programs.add(new GovernmentProgram(
                idGenerator.getAndIncrement(),
                "Agri-Climate Rural Environment Scheme (ACRES)",
                "Supports biodiversity and climate-friendly farming practices.",
                "Irish farmers with eligible land parcels",
                "https://www.gov.ie"
        ));
        programs.add(new GovernmentProgram(
                idGenerator.getAndIncrement(),
                "Organic Farming Scheme",
                "Provides conversion and maintenance support for organic systems.",
                "Farmers entering or maintaining organic production",
                "https://www.gov.ie"
        ));
    }
}
