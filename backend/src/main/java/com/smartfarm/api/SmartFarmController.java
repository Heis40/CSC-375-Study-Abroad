package com.smartfarm.api;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller exposing SmartFarm prototype endpoints.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SmartFarmController {
    private final PrototypeDataService service;

    public SmartFarmController(PrototypeDataService service) {
        this.service = service;
    }

    /**
     * Lightweight health check used by tests and quick diagnostics.
     *
     * @return service status payload
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "SmartFarm API");
    }

    /**
     * Creates a new farmer account.
     *
     * @param request validated signup request body
     * @return authentication response for the new account
     */
    @PostMapping("/auth/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return service.signup(request);
    }

    /**
     * Authenticates an existing farmer.
     *
     * @param request validated login request body
     * @return authentication response for the existing account
     */
    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }

    /**
     * Creates a farm profile under a farmer account.
     *
     * @param request validated farm creation request
     * @return created farm
     */
    @PostMapping("/farms")
    @ResponseStatus(HttpStatus.CREATED)
    public Farm createFarm(@Valid @RequestBody CreateFarmRequest request) {
        return service.createFarm(request);
    }

    /**
     * Creates a field for an existing farm.
     *
     * @param request validated field creation request
     * @return created field
     */
    @PostMapping("/fields")
    @ResponseStatus(HttpStatus.CREATED)
    public Field createField(@Valid @RequestBody CreateFieldRequest request) {
        return service.createField(request);
    }

    /**
     * Lists fields for a farm.
     *
     * @param farmId farm identifier
     * @return all fields belonging to the farm
     */
    @GetMapping("/farms/{farmId}/fields")
    public List<Field> getFields(@PathVariable Long farmId) {
        return service.getFieldsByFarm(farmId);
    }

    /**
     * Adds livestock information for a farm.
     *
     * @param request validated livestock request
     * @return created livestock record
     */
    @PostMapping("/livestock")
    @ResponseStatus(HttpStatus.CREATED)
    public Livestock addLivestock(@Valid @RequestBody AddLivestockRequest request) {
        return service.addLivestock(request);
    }

    /**
     * Returns dashboard metrics for a farm.
     *
     * @param farmId farm identifier
     * @return aggregated dashboard metrics
     */
    @GetMapping("/dashboard/{farmId}")
    public DashboardResponse dashboard(@PathVariable Long farmId) {
        return service.getDashboard(farmId);
    }

    /**
     * Returns advisory recommendations for a farm.
     *
     * @param farmId farm identifier
     * @return crop and grazing recommendations
     */
    @GetMapping("/recommendations/{farmId}")
    public RecommendationResponse recommendations(@PathVariable Long farmId) {
        return service.getRecommendations(farmId);
    }

    /**
     * Returns monitoring points for a field.
     *
     * @param fieldId field identifier
     * @return monitoring timeline for the field
     */
    @GetMapping("/monitoring/{fieldId}")
    public MonitoringResponse monitoring(@PathVariable Long fieldId) {
        return service.getMonitoring(fieldId);
    }

    /**
     * Calculates livestock pressure against available grazing area.
     *
     * @param request validated balance input
     * @return balance status and guidance
     */
    @PostMapping("/calculator/livestock-land")
    public BalanceResponse livestockLandBalance(@Valid @RequestBody BalanceRequest request) {
        return service.calculateBalance(request);
    }

    /**
     * Lists available government support programs.
     *
     * @return active support programs
     */
    @GetMapping("/programs")
    public List<GovernmentProgram> programs() {
        return service.getPrograms();
    }

    /**
     * Submits an application for a government program.
     *
     * @param programId program identifier
     * @param farmerId farmer identifier
     * @return created program application record
     */
    @PostMapping("/programs/{programId}/apply")
    public GovernmentProgramApplication apply(@PathVariable Long programId, @RequestParam Long farmerId) {
        return service.applyToProgram(farmerId, programId);
    }

    /**
     * Generates seasonal report content for a farm.
     *
     * @param farmId farm identifier
     * @param season season label used in report response
     * @return seasonal report payload
     */
    @GetMapping("/reports/seasonal/{farmId}")
    public SeasonalReportResponse seasonalReport(@PathVariable Long farmId,
                                                 @RequestParam(defaultValue = "Spring") String season) {
        return service.getSeasonalReport(farmId, season);
    }

    /**
     * Maps domain validation failures to a client-friendly 400 payload.
     *
     * @param ex raised validation/domain exception
     * @return error payload with a human-readable message
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleBadRequest(IllegalArgumentException ex) {
        return Map.of("error", ex.getMessage());
    }
}
