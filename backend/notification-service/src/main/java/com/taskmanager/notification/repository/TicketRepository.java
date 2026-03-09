/**
 * Mongo repo for tickets - query methods for sender/recipient lookups
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

    Page<Ticket> findBySenderIdOrReceiverIdsContainingOrderByCreatedAtDesc(String senderId, String receiverId, Pageable pageable);

    Page<Ticket> findByReceiverIdsContainingOrderByCreatedAtDesc(String receiverId, Pageable pageable);

    Page<Ticket> findBySenderIdOrderByCreatedAtDesc(String senderId, Pageable pageable);

    long countByReceiverIdsContainingAndStatus(String receiverId, TicketStatus status);
}
