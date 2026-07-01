package com.lms.courseservice.service;

import com.lms.courseservice.entity.Submodule;

import java.util.List;
import java.util.UUID;

public interface SubmoduleService {

    Submodule createSubmodule(Submodule submodule);

    List<Submodule> getAllSubmodules();

    Submodule getSubmoduleById(UUID id);

    Submodule updateSubmodule(UUID id, Submodule submodule);

    void deleteSubmodule(UUID id);
}