package com.mediacollab.scheduler;

import com.mediacollab.entity.Media;
import com.mediacollab.entity.Notification;
import com.mediacollab.entity.User;
import com.mediacollab.repository.MediaRepository;
import com.mediacollab.repository.NotificationRepository;
import com.mediacollab.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DeadlineScheduler {

    @Autowired
    private MediaRepository mediaRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    // Run every day at midnight
    @Scheduled(cron = "0 0 0 * * ?")
    public void checkDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime warningDate = now.plusDays(2);

        List<Media> expiringSoon = mediaRepository.findByEndDateBetween(now, warningDate);
        for (Media media : expiringSoon) {
            notifyUsers(media, "Deadline Approaching", "Media '" + media.getTitle() + "' expires soon.");
        }
    }

    private void notifyUsers(Media media, String title, String message) {
        List<User> companyUsers = userRepository.findByCompanyIdAndIsInternalFalse(media.getCompany().getId());
        for (User u : companyUsers) {
            createNotif(u, media, title, message);
        }
        createNotif(media.getUploader(), media, title, message);
    }

    private void createNotif(User user, Media media, String title, String message) {
        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setType("deadline");
        notif.setRelatedId(media.getId());
        notificationRepository.save(notif);
    }
}
