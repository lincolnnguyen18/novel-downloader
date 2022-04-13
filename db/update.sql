USE novel_downloader;

-- drop procedures get_novels_init and get_novels
DROP PROCEDURE IF EXISTS get_novels_init;
DROP PROCEDURE IF EXISTS get_novels;

DELIMITER //

CREATE PROCEDURE get_novels_init(_limit INT, _search TEXT) BEGIN
  -- SELECT id, title, downloaded_chaps, total_chaps, url, date_added FROM novel ORDER BY id DESC LIMIT _limit;
  SELECT id, title, downloaded_chaps, total_chaps, url, date_added FROM novel WHERE title LIKE CONCAT('%', _search, '%') ORDER BY id DESC LIMIT _limit;
END//

CREATE PROCEDURE get_novels(_continue_id INT, _limit INT, _search TEXT) BEGIN
  -- SELECT id, title, downloaded_chaps, total_chaps, url, date_added FROM novel WHERE id < _continue_id ORDER BY id DESC LIMIT _limit;
  SELECT id, title, downloaded_chaps, total_chaps, url, date_added FROM novel WHERE id < _continue_id AND title LIKE CONCAT('%', _search, '%') ORDER BY id DESC LIMIT _limit;
END//

DELIMITER ;

-- SELECT title from novel where title like "%%";
-- CALL get_novels_init(10, '%');