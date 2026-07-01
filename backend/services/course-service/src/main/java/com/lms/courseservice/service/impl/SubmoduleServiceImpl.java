package com.lms.courseservice.service.impl;

import com.lms.courseservice.entity.Submodule;
import com.lms.courseservice.repository.SubmoduleRepository;
import com.lms.courseservice.service.SubmoduleService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SubmoduleServiceImpl implements SubmoduleService {

    private final SubmoduleRepository submoduleRepository;

    public SubmoduleServiceImpl(SubmoduleRepository submoduleRepository) {
        this.submoduleRepository = submoduleRepository;
    }

    @Override
    public Submodule createSubmodule(Submodule submodule) {
        return submoduleRepository.save(submodule);
    }

    @Override
    public List<Submodule> getAllSubmodules() {
        return submoduleRepository.findAll();
    }

    @Override
    public Submodule getSubmoduleById(UUID id) {
        return submoduleRepository.findById(id).orElse(null);
    }

    @Override
    public Submodule updateSubmodule(UUID id, Submodule submodule) {

        Submodule existing = submoduleRepository.findById(id).orElse(null);

        if (existing != null) {
            existing.setTitle(submodule.getTitle());
            existing.setDescription(submodule.getDescription());
            existing.setModule(submodule.getModule());

            return submoduleRepository.save(existing);
        }

        return null;
    }

    @Override
    public void deleteSubmodule(UUID id) {
        submoduleRepository.deleteById(id);
    }
}