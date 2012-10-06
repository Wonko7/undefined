-- 1-peon
-- 2-Admin
-- 3-Contributor
--Bon apres je sais que tu vas vouloir renommer les roles
-- INSERT INTO author_roles (user_id, role_id
	
INSERT INTO authors (username, password, salt) VALUES ('nom', 'pass', 'salt');
INSERT INTO author_roles SELECT authors.uid, 1 FROM authors WHERE name='nom';)
