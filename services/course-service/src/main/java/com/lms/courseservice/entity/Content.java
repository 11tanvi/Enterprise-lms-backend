package com.lms.courseservice.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
public class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String type;

    private String url;

    @ManyToOne
    @JoinColumn(name = "submodule_id")
    private Submodule submodule;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Submodule getSubmodule() {
        return submodule;
    }

    public void setSubmodule(Submodule submodule) {
        this.submodule = submodule;
    }
}