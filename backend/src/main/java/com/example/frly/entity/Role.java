package com.example.frly.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles", schema = "config")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;
}
