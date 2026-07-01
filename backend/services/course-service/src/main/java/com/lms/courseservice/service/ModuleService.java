package com.lms.courseservice.service;

import com.lms.courseservice.entity.Module;

import java.util.List;
import java.util.UUID;

public interface ModuleService {

    Module createModule(Module module);

    List<Module> getAllModules();

    Module getModuleById(UUID id);

    Module updateModule(UUID id, Module module);

    void deleteModule(UUID id);
}