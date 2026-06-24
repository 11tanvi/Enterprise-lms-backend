package com.lms.courseservice.controller;

import com.lms.courseservice.entity.Module;
import com.lms.courseservice.service.ModuleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/modules")
public class ModuleController {

    private final ModuleService moduleService;

    public ModuleController(ModuleService moduleService) {
        this.moduleService = moduleService;
    }

    @PostMapping
    public Module createModule(@RequestBody Module module) {
        return moduleService.createModule(module);
    }

    @GetMapping
    public List<Module> getAllModules() {
        return moduleService.getAllModules();
    }

    @GetMapping("/{id}")
    public Module getModuleById(@PathVariable UUID id) {
        return moduleService.getModuleById(id);
    }

    @PutMapping("/{id}")
    public Module updateModule(@PathVariable UUID id,
                               @RequestBody Module module) {
        return moduleService.updateModule(id, module);
    }

    @DeleteMapping("/{id}")
    public void deleteModule(@PathVariable UUID id) {
        moduleService.deleteModule(id);
    }
}