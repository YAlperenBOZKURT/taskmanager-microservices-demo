/**
 * MongoDB config - enables auditing so createdAt fields get auto-populated
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration
@EnableMongoAuditing
public class MongoConfig {
}
