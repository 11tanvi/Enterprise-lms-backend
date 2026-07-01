package com.lms.courseservice.controller;

import com.lms.courseservice.entity.Submodule;
import com.lms.courseservice.service.SubmoduleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/submodules")
public class SubmoduleController {

    private final SubmoduleService submoduleService;

    public SubmoduleController(SubmoduleService submoduleService) {
        this.submoduleService = submoduleService;
    }

    @PostMapping
    public Submodule createSubmodule(@RequestBody Submodule submodule) {
        return submoduleService.createSubmodule(submodule);
    }

    @GetMapping
    public List<Submodule> getAllSubmodules() {
        return submoduleService.getAllSubmodules();
    }

    @GetMapping("/{id}")
    public Submodule getSubmoduleById(@PathVariable UUID id) {
        return submoduleService.getSubmoduleById(id);
    }

    @PutMapping("/{id}")
    public Submodule updateSubmodule(@PathVariable UUID id,
                                     @RequestBody Submodule submodule) {
        return submoduleService.updateSubmodule(id, submodule);
    }

    @DeleteMapping("/{id}")
    public void deleteSubmodule(@PathVariable UUID id) {
        submoduleService.deleteSubmodule(id);
    }
}