/**
 * Mongo repo for tickets - query methods for sender/recipient lookups
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.repository;

import com.taskmanager.notification.document.Ticket;
import com.taskmanager.notification.document.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {

    Page<Ticket> findBySenderIdOrRecipientIdOrderByCreatedAtDesc(String senderId, String recipientId, Pageable pageable);

    Page<Ticket> findByRecipientIdOrderByCreatedAtDesc(String recipientId, Pageable pageable);

    Page<Ticket> findBySenderIdOrderByCreatedAtDesc(String senderId, Pageable pageable);

    long countByRecipientIdAndStatus(String recipientId, TicketStatus status);
}
