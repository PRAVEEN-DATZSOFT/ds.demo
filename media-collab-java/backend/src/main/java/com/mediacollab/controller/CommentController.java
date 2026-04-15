package com.mediacollab.controller;

import com.mediacollab.entity.Comment;
import com.mediacollab.entity.Media;
import com.mediacollab.entity.Notification;
import com.mediacollab.entity.User;
import com.mediacollab.repository.CommentRepository;
import com.mediacollab.repository.MediaRepository;
import com.mediacollab.repository.NotificationRepository;
import com.mediacollab.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/media/{mediaId}/comments")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private MediaRepository mediaRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getComments(@PathVariable Long mediaId, Authentication authentication) {
        return ResponseEntity.ok(commentRepository.findByMediaIdOrderByCreatedAtAsc(mediaId));
    }

    @PostMapping
    public ResponseEntity<?> addComment(@PathVariable Long mediaId, @RequestBody Map<String, String> request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Media media = mediaRepository.findById(mediaId).orElseThrow();

        Comment comment = new Comment();
        comment.setContent(request.get("comment"));
        comment.setMedia(media);
        comment.setUser(user);
        
        Comment savedComment = commentRepository.save(comment);

        if (!media.getUploader().getId().equals(user.getId())) {
            Notification notif = new Notification();
            notif.setUser(media.getUploader());
            notif.setTitle("New Comment");
            notif.setMessage(user.getName() + " commented on '" + media.getTitle() + "'");
            notif.setType("comment");
            notif.setRelatedId(media.getId());
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(savedComment);
    }
}
