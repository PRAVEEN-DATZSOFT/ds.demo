package com.mediacollab.repository;

import com.mediacollab.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    List<Media> findAllByOrderByCreatedAtDesc();
    List<Media> findByEndDateBetween(LocalDateTime start, LocalDateTime end);
    List<Media> findByEndDate(LocalDateTime date);
}
