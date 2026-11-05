package com.hotel.model;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "staff")
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffPosition position;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    public Staff() {
    }

    public Staff(String firstName, String lastName, StaffPosition position,
                 String email, String phone, LocalDate hireDate, boolean isActive) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.position = position;
        this.email = email;
        this.phone = phone;
        this.hireDate = hireDate;
        this.isActive = isActive;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public StaffPosition getPosition() {
        return position;
    }

    public void setPosition(StaffPosition position) {
        this.position = position;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
