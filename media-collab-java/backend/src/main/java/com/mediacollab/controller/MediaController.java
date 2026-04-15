package com.mediacollab.controller;

import com.mediacollab.entity.Media;
import com.mediacollab.entity.Notification;
import com.mediacollab.entity.User;
import com.mediacollab.repository.CompanyRepository;
import com.mediacollab.repository.MediaRepository;
import com.mediacollab.repository.NotificationRepository;
import com.mediacollab.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    @Autowired
    private MediaRepository mediaRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CompanyRepository companyRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getMedia(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        List<Media> mediaList;

        if (user.isInternal()) {
            mediaList = mediaRepository.findAllByOrderByCreatedAtDesc();
        } else {
            mediaList = mediaRepository.findByCompanyIdOrderByCreatedAtDesc(user.getCompany().getId());
        }
        return ResponseEntity.ok(mediaList);
    }

    @PostMapping
    public ResponseEntity<?> createMedia(@RequestBody Map<String, String> request, Authentication authentication) {
        User uploader = userRepository.findByEmail(authentication.getName()).orElseThrow();
        
        if (!uploader.isInternal()) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        Media media = new Media();
        media.setTitle(request.get("title"));
        media.setDescription(request.get("description"));
        media.setFilePath(request.get("file_path"));
        media.setFileType(request.get("file_type"));
        media.setCompany(companyRepository.findById(Long.parseLong(request.get("company_id"))).orElseThrow());
        media.setUploader(uploader);
        
        if (request.get("end_date") != null && !request.get("end_date").isEmpty()) {
            media.setEndDate(LocalDateTime.parse(request.get("end_date")));
        }

        Media savedMedia = mediaRepository.save(media);

        // Notifications
        List<User> companyUsers = userRepository.findByCompanyIdAndIsInternalFalse(media.getCompany().getId());
        for (User u : companyUsers) {
            Notification notif = new Notification();
            notif.setUser(u);
            notif.setTitle("New Media Assigned");
            notif.setMessage("Media '" + media.getTitle() + "' was assigned to your company.");
            notif.setType("upload");
            notif.setRelatedId(savedMedia.getId());
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(savedMedia);
    }
}
