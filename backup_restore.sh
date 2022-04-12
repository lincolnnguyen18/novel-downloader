# backup
mysqldump -u admin -p novel_downloader > backup.sql
# restore
mysql -u admin -p novel_downloader < backup.sql