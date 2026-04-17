package com.smartfarm.api;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SmartFarmController {
    private final PrototypeDataService service;

    public SmartFarmController(PrototypeDataService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "SmartFarm API");
    }

    @PostMapping("/auth/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return service.signup(request);
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }

    @PostMapping("/farms")
    @ResponseStatus(HttpStatus.CREATED)
    public Farm createFarm(@Valid @RequestBody CreateFarmRequest request) {
        return service.createFarm(request);
    }

    @PostMapping("/fields")
    @ResponseStatus(HttpStatus.CREATED)
    public Field createField(@Valid @RequestBody CreateFieldRequest request) {
        return service.createField(request);
    }

    @GetMapping("/farms/{farmId}/fields")
    public List<Field> getFields(@PathVariable Long farmId) {
        return service.getFieldsByFarm(farmId);
    }

    @PostMapping("/livestock")
    @ResponseStatus(HttpStatus.CREATED)
    public Livestock addLivestock(@Valid @RequestBody AddLivestockRequest request) {
        return service.addLivestock(request);
    }

    @GetMapping("/dashboard/{farmId}")
    public DashboardResponse dashboard(@PathVariable Long farmId) {
        return service.getDashboard(farmId);
    }

    @GetMapping("/recommendations/{farmId}")
    public RecommendationResponse recommendations(@PathVariable Long farmId) {
        return service.getRecommendations(farmId);
    }

    @GetMapping("/monitoring/{fieldId}")
    public MonitoringResponse monitoring(@PathVariable Long fieldId) {
        return service.getMonitoring(fieldId);
    }

    @PostMapping("/calculator/livestock-land")
    public BalanceResponse livestockLandBalance(@Valid @RequestBody BalanceRequest request) {
        return service.calculateBalance(request);
    }

    @GetMapping("/programs")
    public List<GovernmentProgram> programs() {
        return service.getPrograms();
    }

    @PostMapping("/programs/{programId}/apply")
    public GovernmentProgramApplication apply(@PathVariable Long programId, @RequestParam Long farmerId) {
        return service.applyToProgram(farmerId, programId);
    }

    @GetMapping("/reports/seasonal/{farmId}")
    public SeasonalReportResponse seasonalReport(@PathVariable Long farmId,
                                                 @RequestParam(defaultValue = "Spring") String season) {
        return service.getSeasonalReport(farmId, season);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleBadRequest(IllegalArgumentException ex) {
        return Map.of("error", ex.getMessage());
    }
}
