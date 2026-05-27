package com.smartfarm.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/** Request body used to create a new farmer account. */
record SignupRequest(
        @NotBlank String fullName,
        @Email String email,
        @NotBlank String password,
        @NotBlank String county
) {}

/** Request body used to authenticate an existing farmer. */
record LoginRequest(
        @Email String email,
        @NotBlank String password
) {}

/** Authentication payload returned after signup/login. */
record AuthResponse(Long farmerId, String fullName, String token) {}

/** Farmer profile captured by the prototype service. */
record Farmer(Long id, String fullName, String email, String password, String county) {}
/** Farm entity associated with a farmer account. */
record Farm(Long id, Long farmerId, String name, String county, double totalAreaHa) {}
/** Field parcel with a geospatial boundary in WKT format. */
record Field(Long id, Long farmId, String name, String landUseType, String polygonWkt, double areaHa) {}
/** Crop assignment for a field and season. */
record Crop(Long id, Long fieldId, String cropType, String season) {}
/** Soil health sample for a field on a specific date. */
record SoilHealth(Long id, Long fieldId, LocalDate sampleDate, double ph, double nitrogen, double phosphorus, double potassium, String status) {}
/** Satellite-derived monitoring point for a field. */
record SatelliteMonitoring(Long id, Long fieldId, LocalDate captureDate, double ndvi, String condition) {}
/** Livestock inventory metrics linked to a farm. */
record Livestock(Long id, Long farmId, String species, int headCount, double livestockUnits) {}
/** Public support program available to farmers. */
record GovernmentProgram(Long id, String name, String description, String eligibility, String applicationUrl) {}
/** Program application submitted by a farmer. */
record GovernmentProgramApplication(Long id, Long farmerId, Long programId, String status, LocalDate appliedOn) {}
/** Predicted seasonal yield for a field and crop type. */
record YieldPrediction(Long id, Long fieldId, String cropType, String season, double predictedTons, double confidenceScore) {}

/** Request body for creating a farm. */
record CreateFarmRequest(@NotNull Long farmerId, @NotBlank String name, @NotBlank String county, @Min(1) double totalAreaHa) {}
/** Request body for creating a field within a farm. */
record CreateFieldRequest(@NotNull Long farmId, @NotBlank String name, @NotBlank String landUseType, @NotBlank String polygonWkt, @Min(0) double areaHa) {}
/** Request body for adding livestock details to a farm. */
record AddLivestockRequest(@NotNull Long farmId, @NotBlank String species, @Min(1) int headCount, @Min(0) double livestockUnits) {}

/** Aggregated dashboard metrics displayed in the app home dashboard. */
record DashboardResponse(double vegetationHealthScore, String soilStatus, double livestockLandBalance, int activeFields) {}
/** Recommendation payload for crop diversification and grazing actions. */
record RecommendationResponse(List<String> cropDiversificationSuggestions, List<String> grazingOptimizationSuggestions) {}
/** Time-series monitoring points for a specific field. */
record MonitoringResponse(Long fieldId, List<SatelliteMonitoring> points) {}

/** Request body for livestock-to-land ratio calculation. */
record BalanceRequest(@Min(0) double totalLivestockUnits, @DecimalMin("0.1") double totalGrazingAreaHa) {}
/** Balance calculator result including status and guidance. */
record BalanceResponse(double ratio, String status, String guidance) {}

/** Combined seasonal report model used by the reporting endpoint. */
record SeasonalReportResponse(Long farmId, String season, DashboardResponse dashboard, RecommendationResponse recommendations,
                            List<YieldPrediction> yieldForecasts) {}
