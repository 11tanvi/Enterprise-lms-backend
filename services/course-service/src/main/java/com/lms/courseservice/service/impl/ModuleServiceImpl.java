package com.lms.courseservice.service.impl;

import com.lms.courseservice.entity.Module;
import com.lms.courseservice.repository.ModuleRepository;
import com.lms.courseservice.service.ModuleService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ModuleServiceImpl implements ModuleService {

    private final ModuleRepository moduleRepository;

    public ModuleServiceImpl(ModuleRepository moduleRepository) {
        this.moduleRepository = moduleRepository;
    }

    @Override
    public Module createModule(Module module) {
        return moduleRepository.save(module);
    }

    @Override
    public List<Module> getAllModules() {
        return moduleRepository.findAll();
    }

    @Override
    public Module getModuleById(UUID id) {
        return moduleRepository.findById(id).orElse(null);
    }

    @Override
    public Module updateModule(UUID id, Module module) {

        Module existing = moduleRepository.findById(id).orElse(null);

        if (existing != null) {
            existing.setTitle(module.getTitle());
            existing.setDescription(module.getDescription());
            existing.setCourse(module.getCourse());

            return moduleRepository.save(existing);
        }

        return null;
    }

    @Override
    public void deleteModule(UUID id) {
        moduleRepository.deleteById(id);
    }
}