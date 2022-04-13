USE novel_downloader;

-- drop procedure get_to_translate
DROP PROCEDURE IF EXISTS get_to_translate;

DELIMITER //

CREATE PROCEDURE get_to_translate(_id INT) BEGIN
  SELECT toTranslate, CHAR_LENGTH(translated) as translated_length, initToTranslateLength, toTranslatedTranslatedLength FROM novel WHERE id = _id;
END//

DELIMITER ;