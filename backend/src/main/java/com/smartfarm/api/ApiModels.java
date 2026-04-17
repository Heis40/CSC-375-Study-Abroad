package com.smartfarm.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

record SignupRequest(
        @NotBlank String fullName,
        @Email String email,
        @NotBlank String password,
        @NotBlank String county
) {}

record LoginRequest(
        @Email String email,
        @NotBlank String password
) {}

record AuthResponse(Long farmerId, String fullName, String token) {}

record Farmer(Long id, String fullName, String email, String password, String county) {}
record Farm(Long id, Long farmerId, String name, String county, double totalAreaHa) {}
record Field(Long id, Long farmId, String name, String landUseType, String polygonWkt, double areaHa) {}
record Crop(Long id, Long fieldId, String cropType, String season) {}
record SoilHealth(Long id, Long fieldId, LocalDate sampleDate, double ph, double nitrogen, double phosphorus, double potassium, String status) {}
record SatelliteMonitoring(Long id, Long fieldId, LocalDate captureDate, double ndvi, String condition) {}
record Livestock(Long id, Long farmId, String species, int headCount, double livestockUnits) {}
record GovernmentProgram(Long id, String name, String description, String eligibility, String applicationUrl) {}
record GovernmentProgramApplication(Long id, Long farmerId, Long programId, String status, LocalDate appliedOn) {}
record YieldPrediction(Long id, Long fieldId, String cropType, String season, double predictedTons, double confidenceScore) {}

record CreateFarmRequest(@NotNull Long farmerId, @NotBlank String name, @NotBlank String county, @Min(1) double totalAreaHa) {}
record CreateFieldRequest(@NotNull Long farmId, @NotBlank String name, @NotBlank String landUseType, @NotBlank String polygonWkt, @Min(0) double areaHa) {}
record AddLivestockRequest(@NotNull Long farmId, @NotBlank String species, @Min(1) int headCount, @Min(0) double livestockUnits) {}

record DashboardResponse(double vegetationHealthScore, String soilStatus, double livestockLandBalance, int activeFields) {}
record RecommendationResponse(List<String> cropDiversificationSuggestions, List<String> grazingOptimizationSuggestions) {}
record MonitoringResponse(Long fieldId, List<SatelliteMonitoring> points) {}

record BalanceRequest(@Min(0) double totalLivestockUnits, @DecimalMin("0.1") double totalGrazingAreaHa) {}
record BalanceResponse(double ratio, String status, String guidance) {}

record SeasonalReportResponse(Long farmId, String season, DashboardResponse dashboard, RecommendationResponse recommendations,
                            List<YieldPrediction> yieldForecasts) {}
