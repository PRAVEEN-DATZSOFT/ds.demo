package com.mediacollab.repository;

import com.mediacollab.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByMediaIdOrderByCreatedAtAsc(Long mediaId);
}
