-- novel(id, title, date_added, downloaded_chaps, total_chaps, to_translate, translated)

DROP DATABASE IF EXISTS novel_downloader;
CREATE DATABASE novel_downloader;
USE novel_downloader;

CREATE TABLE novel(
  id INT NOT NULL AUTO_INCREMENT,
  title TEXT NOT NULL,
  date_added DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  downloaded_chaps INT NOT NULL DEFAULT 0,
  total_chaps INT NOT NULL,
  translated LONGTEXT,
  url TEXT NOT NULL,
  PRIMARY KEY (id)
);

DELIMITER //

CREATE PROCEDURE check_link(_url TEXT) BEGIN
  SELECT COUNT(*) as url_exists FROM novel WHERE url = _url;
END //

CREATE PROCEDURE add_novel(_title TEXT, _total_chaps INT, _url TEXT, _translated LONGTEXT) BEGIN
  INSERT INTO novel(title, total_chaps, url, translated) VALUES(_title, _total_chaps, _url, _translated);
END//

CREATE PROCEDURE append_to_translated(
  _id INT,
  _new_translated LONGTEXT,
  _new_downloaded_chaps INT
) BEGIN
  UPDATE novel SET translated = CONCAT(translated, _new_translated) WHERE id = _id;
  UPDATE novel SET downloaded_chaps = _new_downloaded_chaps WHERE id = _id;
END//

CREATE PROCEDURE delete_novel(_id INT) BEGIN
  DELETE FROM novel WHERE id = _id;
END//

CREATE PROCEDURE update_downloaded_chaps(
  _id INT,
  _downloaded_chaps INT
) BEGIN
  UPDATE novel SET downloaded_chaps = _downloaded_chaps WHERE id = _id;
END//

CREATE PROCEDURE get_novel_text(
  _id INT
) BEGIN
  SELECT translated FROM novel WHERE id = _id;
END//

CREATE PROCEDURE get_novels_init(_limit INT) BEGIN
  SELECT id, title, downloaded_chaps, total_chaps, url, date_added FROM novel ORDER BY id DESC LIMIT _limit;
END//

CREATE PROCEDURE get_novels(_continue_id INT, _limit INT) BEGIN
  SELECT id, title, downloaded_chaps, total_chaps, url, date_added FROM novel WHERE id < _continue_id ORDER BY id DESC LIMIT _limit;
END//

DELIMITER ;