-- PASCOAL Photography — Database Schema
-- MySQL 8.0+ | InnoDB | utf8mb4

CREATE DATABASE IF NOT EXISTS pascoal_photography
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pascoal_photography;

-- ============================================================
-- ACCOUNTS & AUTH
-- ============================================================

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  recovery_email VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- DB-backed sessions so they can be listed/revoked (not bare stateless JWTs)
CREATE TABLE sessions (
  id CHAR(36) PRIMARY KEY,                 -- UUID, stored in the cookie
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,            -- sha256 of the secret half of the cookie
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_prt_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- MEDIA (metadata + URL only — never binary data)
-- ============================================================

CREATE TABLE media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT UNSIGNED NOT NULL DEFAULT 0,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  type ENUM('image','video') NOT NULL DEFAULT 'image',
  alt_text VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SITE-WIDE SETTINGS (singleton rows, id = 1)
-- ============================================================

CREATE TABLE site_settings (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  site_name VARCHAR(120) NOT NULL DEFAULT 'PASCOAL Photography',
  site_description VARCHAR(255) NULL,
  copyright_text VARCHAR(255) NULL,
  accent_color VARCHAR(20) NULL,
  logo_media_id INT UNSIGNED NULL,
  favicon_media_id INT UNSIGNED NULL,
  public_email VARCHAR(255) NULL,
  phone VARCHAR(40) NULL,
  whatsapp VARCHAR(40) NULL,
  location VARCHAR(255) NULL,
  maps_url VARCHAR(500) NULL,
  footer_description VARCHAR(255) NULL,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (logo_media_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (favicon_media_id) REFERENCES media(id) ON DELETE SET NULL,
  CONSTRAINT chk_site_settings_singleton CHECK (id = 1)
) ENGINE=InnoDB;

CREATE TABLE homepage_settings (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  hero_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  hero_interval_ms INT UNSIGNED NOT NULL DEFAULT 5000,
  hero_autoplay BOOLEAN NOT NULL DEFAULT TRUE,
  hero_transition VARCHAR(30) NOT NULL DEFAULT 'crossfade',
  hero_label VARCHAR(120) NULL,
  hero_title VARCHAR(255) NULL,
  hero_description VARCHAR(500) NULL,
  hero_cta_primary_text VARCHAR(60) NULL,
  hero_cta_primary_link VARCHAR(255) NULL,
  hero_cta_secondary_text VARCHAR(60) NULL,
  hero_cta_secondary_link VARCHAR(255) NULL,
  hero_location_text VARCHAR(120) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_homepage_settings_singleton CHECK (id = 1),
  CONSTRAINT chk_hero_interval CHECK (hero_interval_ms BETWEEN 3000 AND 8000)
) ENGINE=InnoDB;

CREATE TABLE hero_slides (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  media_id INT UNSIGNED NOT NULL,
  alt_text VARCHAR(255) NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  INDEX idx_hero_slides_order (display_order)
) ENGINE=InnoDB;

CREATE TABLE about_content (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  profile_media_id INT UNSIGNED NULL,
  name VARCHAR(120) NULL,
  title VARCHAR(150) NULL,
  biography TEXT NULL,
  location VARCHAR(150) NULL,
  quote VARCHAR(400) NULL,
  heading VARCHAR(150) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_media_id) REFERENCES media(id) ON DELETE SET NULL,
  CONSTRAINT chk_about_singleton CHECK (id = 1)
) ENGINE=InnoDB;

CREATE TABLE navigation_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(60) NOT NULL,
  href VARCHAR(255) NOT NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE social_platforms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  platform_name VARCHAR(60) NOT NULL,
  url VARCHAR(500) NOT NULL,
  username VARCHAR(120) NULL,
  icon VARCHAR(60) NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- CONTENT: categories, shoots, stories, films, services
-- ============================================================

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE shoots (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  category_id INT UNSIGNED NULL,
  description TEXT NULL,
  location VARCHAR(150) NULL,
  event_date DATE NULL,
  cover_media_id INT UNSIGNED NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL,
  INDEX idx_shoots_published (published),
  INDEX idx_shoots_featured (featured)
) ENGINE=InnoDB;

CREATE TABLE shoot_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shoot_id INT UNSIGNED NOT NULL,
  media_id INT UNSIGNED NOT NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (shoot_id) REFERENCES shoots(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  INDEX idx_shoot_images_shoot (shoot_id)
) ENGINE=InnoDB;

CREATE TABLE albums (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  description TEXT NULL,
  location VARCHAR(150) NULL,
  event_date DATE NULL,
  cover_media_id INT UNSIGNED NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE album_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  album_id INT UNSIGNED NOT NULL,
  media_id INT UNSIGNED NOT NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  INDEX idx_album_images_album (album_id)
) ENGINE=InnoDB;

CREATE TABLE videos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  description TEXT NULL,
  category VARCHAR(60) NULL,
  video_media_id INT UNSIGNED NULL,
  thumbnail_media_id INT UNSIGNED NULL,
  location VARCHAR(150) NULL,
  event_date DATE NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (video_media_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (thumbnail_media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  image_media_id INT UNSIGNED NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (image_media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- ENQUIRIES / MESSAGING
-- ============================================================

CREATE TABLE enquiries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  event_type VARCHAR(80) NULL,
  event_date DATE NULL,
  location VARCHAR(150) NULL,
  budget VARCHAR(80) NULL,
  message TEXT NOT NULL,
  status ENUM('new','viewed','replied','customer_replied','follow_up','confirmed','completed','cancelled')
    NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enquiries_status (status)
) ENGINE=InnoDB;

CREATE TABLE messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enquiry_id INT UNSIGNED NOT NULL,
  sender ENUM('photographer','customer') NOT NULL,
  body TEXT NOT NULL,
  subject VARCHAR(255) NULL,
  message_id_header VARCHAR(255) NULL,   -- email Message-ID, used to match customer replies
  delivery_status ENUM('sent','failed','received') NOT NULL DEFAULT 'received',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  INDEX idx_messages_enquiry (enquiry_id),
  INDEX idx_messages_msgid (message_id_header)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS & ACTIVITY LOG
-- ============================================================

CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body VARCHAR(500) NULL,
  related_type VARCHAR(60) NULL,
  related_id INT UNSIGNED NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(80) NOT NULL,
  description VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Custom / one-off pages the photographer can create from the dashboard (Website -> Pages).
-- Lets a new navigation menu item point at real content instead of a 404.
CREATE TABLE custom_pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  content TEXT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Generic DB-backed rate limiting (login, contact form, password reset)
CREATE TABLE rate_limit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bucket VARCHAR(40) NOT NULL,
  key_hash CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rl_lookup (bucket, key_hash, created_at)
) ENGINE=InnoDB;

-- ============================================================
-- SEED: singleton settings rows must exist
-- ============================================================

INSERT INTO site_settings (id, site_name, phone, whatsapp, location)
VALUES (1, 'PASCOAL Photography', '+91 80809 85290', '+91 80809 85290', 'Goa, India')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO homepage_settings (id, hero_label, hero_title, hero_description, hero_cta_primary_text, hero_cta_secondary_text, hero_location_text)
VALUES (1, 'PHOTOGRAPHY / FILMS / STORIES', 'CAPTURING MOMENTS THAT BECOME STORIES.',
  'Wedding, portrait and editorial photography across Goa and beyond, documented with a cinematic, unhurried eye.',
  'VIEW WORK', 'LET''S TALK', 'GOA, INDIA')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO about_content (id, name, title, location, biography)
VALUES (1, 'Pascoal Joel Fernandes', 'Photographer', 'Goa, India',
  'I''m a Goa-based photographer dedicated to capturing the raw beauty and authentic stories of the people and places around me. My work blends editorial precision with a deep appreciation for India''s vibrant light and diverse cultures. I believe every frame is an opportunity to create something timeless, and I look forward to bringing your unique vision to life through my lens.')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO social_platforms (platform_name, url, username, icon, display_order, enabled)
VALUES ('Instagram', 'https://www.instagram.com/pascoal_photography/', '@pascoal_photography', 'instagram', 0, TRUE)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO navigation_items (label, href, display_order, visible) VALUES
  ('Home', '/', 0, TRUE),
  ('Portfolio', '/portfolio', 1, TRUE),
  ('Stories', '/stories', 2, TRUE),
  ('Films', '/films', 3, TRUE),
  ('About', '/about', 4, TRUE),
  ('Services', '/services', 5, TRUE),
  ('Contact', '/contact', 6, TRUE)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO categories (name, slug, display_order) VALUES
  ('Wedding', 'wedding', 0), ('Birthday', 'birthday', 1), ('Party', 'party', 2),
  ('Pre-Wedding', 'pre-wedding', 3), ('Portrait', 'portrait', 4), ('Event', 'event', 5),
  ('Fashion', 'fashion', 6), ('Travel', 'travel', 7), ('Corporate', 'corporate', 8),
  ('Baby Shoot', 'baby-shoot', 9), ('Maternity', 'maternity', 10),
  ('Engagement', 'engagement', 11), ('Other', 'other', 12)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO services (name, description, display_order, published) VALUES
  ('Wedding Photography', 'Coverage of your wedding day, from the quiet preparations to the last dance.', 0, TRUE),
  ('Birthday Photography', 'Relaxed, candid coverage of birthday celebrations for all ages.', 1, TRUE),
  ('Portrait Photography', 'Individual, couple and family portraits in natural light.', 2, TRUE),
  ('Event Photography', 'Documenting private and corporate events as they unfold.', 3, TRUE),
  ('Pre-Wedding Photography', 'A relaxed session to celebrate the two of you before the big day.', 4, TRUE),
  ('Cinematic Films', 'Short cinematic films that bring your story to life in motion.', 5, TRUE);
