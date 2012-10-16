-- FULL BACKUP BELOW Octobruary, 11th 2012

--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = off;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET escape_string_warning = off;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

DROP TABLE IF EXISTS article_categories, article_tags, article_authors, author_roles, articles, categories, tags, authors, projects, roles, comments;

CREATE TABLE article_authors (
    artid integer NOT NULL,
    authid integer NOT NULL
);
ALTER TABLE public.article_authors OWNER TO landolphia;

CREATE TABLE article_categories (
    artid integer NOT NULL,
    catid integer NOT NULL
);
ALTER TABLE public.article_categories OWNER TO landolphia;

CREATE TABLE article_tags (
    artid integer NOT NULL,
    tagid integer NOT NULL
);
ALTER TABLE public.article_tags OWNER TO landolphia;

CREATE TABLE articles (
    uid integer NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    birth timestamp(0) without time zone DEFAULT now()
);
ALTER TABLE public.articles OWNER TO landolphia;

CREATE SEQUENCE articles_uid_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;
ALTER TABLE public.articles_uid_seq OWNER TO landolphia;
ALTER SEQUENCE articles_uid_seq OWNED BY articles.uid;
SELECT pg_catalog.setval('articles_uid_seq', 3, true);

CREATE TABLE author_roles (
    authid integer NOT NULL,
    roleid integer NOT NULL
);
ALTER TABLE public.author_roles OWNER TO landolphia;

CREATE TABLE authors (
    uid integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    salt text NOT NULL,
    email text NOT NULL
);
ALTER TABLE public.authors OWNER TO landolphia;

CREATE SEQUENCE authors_uid_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;
ALTER TABLE public.authors_uid_seq OWNER TO landolphia;
ALTER SEQUENCE authors_uid_seq OWNED BY authors.uid;
SELECT pg_catalog.setval('authors_uid_seq', 2, true);

CREATE TABLE categories (
    uid integer NOT NULL,
    label text NOT NULL
);
ALTER TABLE public.categories OWNER TO landolphia;

CREATE SEQUENCE categories_uid_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;
ALTER TABLE public.categories_uid_seq OWNER TO landolphia;
ALTER SEQUENCE categories_uid_seq OWNED BY categories.uid;
SELECT pg_catalog.setval('categories_uid_seq', 2, true);


CREATE TABLE comments (
    uid integer NOT NULL,
    content text NOT NULL,
    artid integer,
    authid integer,
    birth timestamp(0) without time zone DEFAULT now(),
    edit timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);
ALTER TABLE public.comments OWNER TO landolphia;

CREATE SEQUENCE comments_uid_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;
ALTER TABLE public.comments_uid_seq OWNER TO landolphia;
ALTER SEQUENCE comments_uid_seq OWNED BY comments.uid;
SELECT pg_catalog.setval('comments_uid_seq', 1, false);

CREATE TABLE projects (
    uid integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    link text NOT NULL,
    screenshot text NOT NULL,
    pin integer NOT NULL
);
ALTER TABLE public.projects OWNER TO landolphia;

CREATE SEQUENCE projects_uid_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;
ALTER TABLE public.projects_uid_seq OWNER TO landolphia;
ALTER SEQUENCE projects_uid_seq OWNED BY projects.uid;
SELECT pg_catalog.setval('projects_uid_seq', 3, true);

CREATE TABLE roles (
    uid integer NOT NULL,
    label text NOT NULL
);
ALTER TABLE public.roles OWNER TO landolphia;
CREATE SEQUENCE roles_uid_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;
ALTER TABLE public.roles_uid_seq OWNER TO landolphia;
ALTER SEQUENCE roles_uid_seq OWNED BY roles.uid;
SELECT pg_catalog.setval('roles_uid_seq', 4, true);

CREATE TABLE tags (
    uid integer NOT NULL,
    label text NOT NULL
);
ALTER TABLE public.tags OWNER TO landolphia;
CREATE SEQUENCE tags_uid_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;
ALTER TABLE public.tags_uid_seq OWNER TO landolphia;
ALTER SEQUENCE tags_uid_seq OWNED BY tags.uid;
SELECT pg_catalog.setval('tags_uid_seq', 4, true);

ALTER TABLE ONLY articles ALTER COLUMN uid SET DEFAULT nextval('articles_uid_seq'::regclass);
ALTER TABLE ONLY authors ALTER COLUMN uid SET DEFAULT nextval('authors_uid_seq'::regclass);
ALTER TABLE ONLY categories ALTER COLUMN uid SET DEFAULT nextval('categories_uid_seq'::regclass);
ALTER TABLE ONLY comments ALTER COLUMN uid SET DEFAULT nextval('comments_uid_seq'::regclass);
ALTER TABLE ONLY projects ALTER COLUMN uid SET DEFAULT nextval('projects_uid_seq'::regclass);
ALTER TABLE ONLY roles ALTER COLUMN uid SET DEFAULT nextval('roles_uid_seq'::regclass);
ALTER TABLE ONLY tags ALTER COLUMN uid SET DEFAULT nextval('tags_uid_seq'::regclass);


INSERT INTO article_authors VALUES (2, 2);
INSERT INTO article_authors VALUES (2, 1);
INSERT INTO article_authors VALUES (1, 2);
INSERT INTO article_authors VALUES (3, 2);

INSERT INTO article_categories VALUES (2, 2);
INSERT INTO article_categories VALUES (1, 1);
INSERT INTO article_categories VALUES (3, 1);

INSERT INTO article_tags VALUES (2, 3);
INSERT INTO article_tags VALUES (1, 1);
INSERT INTO article_tags VALUES (3, 4);

INSERT INTO articles VALUES (2, 'Undefined is up!', '<p>Undefined now has a website. We''ll be showing our
<a href="projects">projects</a>, and keeping the technical blog & news
section up to date. We have feeds for your favourite news aggragator; 
<a data-ext="true" href="http://undefined.re/news-feed">News Feed</a> and 
<a data-ext="true" href="http://undefined.re/blog-feed">Blog Feed</a>.
</p>

<p>The website''s <a href="https://github.com/defined/undefined/" data-ext="true">source code</a>
is on github, check it out if you''re into clojure.</p>', '2012-10-07 18:03:56');
INSERT INTO articles VALUES (1, 'Vim sniper', '<p>Vim''s cursorline & cursorcolumn are widely used and known and loved settings.
I never got used to them, they always end up annoying me; I like being able to
spot the cursor that easily, but while reading code I find it distracting.</p>

<p>So this is what I ended up using:</p>

<div class="code">set updatetime=2000

function! MySetCursor()
	set cursorline
	set cursorcolumn
endfunction
function! MyUnSetCursor()
	set nocursorline
	set nocursorcolumn
endfunction

au! CursorHold * call MyUnSetCursor()
au! CursorMoved * call MySetCursor()
au! CursorMovedI * call MyUnSetCursor()</div>

<p>It shows the cursor line & column while moving around in a buffer, hides it
after an idle time of 2 seconds, and hides it in input mode (because if I''m
writing in a buffer, hopefully I already know where I am...).</p>
', '2012-10-07 18:02:03');
INSERT INTO articles VALUES (3, 'McGyver''s null modem', '<p>What do you do when you want to connect two female D9 connectors and
the shops are closed when you realise that what you don''t have a null modem?
You badly want to play with an embedded device...
</p>

<p>If you feel in a McGyver kind of mood, you can make yourself one with a few
wires. I used cigarette filters to hold the wires in place (my first idea was
cork but couldn''t find any).<br>
<center><img src="img/null-modem.png" /></center>
</p>

<p>More information on RS232 serial null modem cable wiring <a href="http://www.lammertbies.nl/comm/info/RS-232_null_modem.html">here</a>.
</p>', '2012-10-09 16:15:24');

INSERT INTO author_roles VALUES (1, 2);
INSERT INTO author_roles VALUES (2, 2);

INSERT INTO authors VALUES (1, 'Landolphia', '$2a$10$BaeeLnmUjxsRfa.BSc/mderQTDzFz0LhSaWzsZW0wbgtE/ArKS3x2', 'tempnull', 'landolphia@undefined.re');
INSERT INTO authors VALUES (2, 'Wonko', '$2a$10$/8C.pT7tn7Y5uCEN1eWOEOHSLMh4WwG5Yp808mOMlkw4GT/AGTqdy', 'tempnull', 'wonko7@undefined.re');

INSERT INTO categories VALUES (1, 'blog');
INSERT INTO categories VALUES (2, 'news');

INSERT INTO projects VALUES (1, 'Undefined''s Webiste', '<p>Our website''s source code is on github, check it out: <a href="https://github.com/defined/undefined/" data-ext="true">undefined</a>.</p> <p>We use the following projects; <a href="http://clojure.org">clojure</a>, <a href="https://github.com/clojure/clojurescript" data-ext="true">clojurescript</a>, <a href="http://webnoir.org" data-ext="true">noir</a>, <a href="https://github.com/ibdknox/fetch" data-ext="true">fetch</a>, <a href="https://github.com/cemerick/friend" data-ext="true">friend</a>, <a href="https://github.com/korma/Korma" data-ext="true">korma</a>, <a href="https://github.com/cgrand/enlive" data-ext="true">enlive</a>, <a href="https://github.com/ckirkendall/enfocus" data-ext="true">enfocus</a> & <a href="http://compass-style.org/" data-ext="true">compass</a>. All <a href="mailto:defined@undefined.re" data-ext="true">comments</a> are welcome.</p>', 'https://github.com/defined/undefined/', '', 3);
INSERT INTO projects VALUES (2, 'Budget Splitter', '<p>Budget Splitter is an application designed to help you share a budget on outings with friends.</p><p>Alice rented a car for the trip which cost her $75, Bob payed $50 for gas & Charlie $25 worth of pizzas. Bob also paid $15 for two cinema tickets and popcorn. Alice didn''t go and won''t be participating in that expense.</p><p>How do we equalise the expenses? Budget Splitter to the rescue!</p><p>Budget Splitter targets WebKit browsers: Iphone, Android, Chrome & Safari.</p>', '/projects/budget-splitter/index.html', '/img/budgetsplitter.png', 2);

INSERT INTO roles VALUES (1, 'peon');
INSERT INTO roles VALUES (2, 'admin');
INSERT INTO roles VALUES (3, 'contributor');

INSERT INTO tags VALUES (1, 'vim');
INSERT INTO tags VALUES (2, 'annoucement');
INSERT INTO tags VALUES (3, 'undefined');
INSERT INTO tags VALUES (4, 'hacks');



ALTER TABLE ONLY article_authors
    ADD CONSTRAINT article_authors_pkey PRIMARY KEY (artid, authid);
ALTER TABLE ONLY article_categories
    ADD CONSTRAINT article_categories_pkey PRIMARY KEY (artid, catid);
ALTER TABLE ONLY article_tags
    ADD CONSTRAINT article_tags_pkey PRIMARY KEY (artid, tagid);
ALTER TABLE ONLY articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (uid);
ALTER TABLE ONLY author_roles
    ADD CONSTRAINT author_roles_pkey PRIMARY KEY (authid, roleid);
ALTER TABLE ONLY authors
    ADD CONSTRAINT authors_email_key UNIQUE (email);
ALTER TABLE ONLY authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (uid);
ALTER TABLE ONLY authors
    ADD CONSTRAINT authors_username_key UNIQUE (username);
ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_label_key UNIQUE (label);
ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (uid);
ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (uid);
ALTER TABLE ONLY projects
    ADD CONSTRAINT projects_pin_key UNIQUE (pin);
ALTER TABLE ONLY projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (uid);
ALTER TABLE ONLY roles
    ADD CONSTRAINT roles_label_key UNIQUE (label);
ALTER TABLE ONLY roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (uid);
ALTER TABLE ONLY tags
    ADD CONSTRAINT tags_label_key UNIQUE (label);
ALTER TABLE ONLY tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (uid);

CREATE UNIQUE INDEX email_lower_id ON authors USING btree (lower(email));
CREATE UNIQUE INDEX username_lower_id ON authors USING btree (lower(username));

ALTER TABLE ONLY article_authors
    ADD CONSTRAINT article_authors_artid_fkey FOREIGN KEY (artid) REFERENCES articles(uid) ON DELETE CASCADE;
ALTER TABLE ONLY article_authors
    ADD CONSTRAINT article_authors_authid_fkey FOREIGN KEY (authid) REFERENCES authors(uid) ON DELETE CASCADE;
ALTER TABLE ONLY article_categories
    ADD CONSTRAINT article_categories_artid_fkey FOREIGN KEY (artid) REFERENCES articles(uid) ON DELETE CASCADE;
ALTER TABLE ONLY article_categories
    ADD CONSTRAINT article_categories_catid_fkey FOREIGN KEY (catid) REFERENCES categories(uid) ON DELETE CASCADE;
ALTER TABLE ONLY article_tags
    ADD CONSTRAINT article_tags_artid_fkey FOREIGN KEY (artid) REFERENCES articles(uid) ON DELETE CASCADE;
ALTER TABLE ONLY article_tags
    ADD CONSTRAINT article_tags_tagid_fkey FOREIGN KEY (tagid) REFERENCES tags(uid) ON DELETE CASCADE;
ALTER TABLE ONLY author_roles
    ADD CONSTRAINT author_roles_authid_fkey FOREIGN KEY (authid) REFERENCES authors(uid) ON DELETE CASCADE;
ALTER TABLE ONLY author_roles
    ADD CONSTRAINT author_roles_roleid_fkey FOREIGN KEY (roleid) REFERENCES roles(uid) ON DELETE CASCADE;
ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_artid_fkey FOREIGN KEY (artid) REFERENCES articles(uid) ON DELETE CASCADE;
ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_authid_fkey FOREIGN KEY (authid) REFERENCES authors(uid);

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;

REVOKE ALL ON TABLE article_authors FROM PUBLIC;
REVOKE ALL ON TABLE article_authors FROM landolphia;
GRANT ALL ON TABLE article_authors TO landolphia;
GRANT ALL ON TABLE article_authors TO web;

REVOKE ALL ON TABLE article_categories FROM PUBLIC;
REVOKE ALL ON TABLE article_categories FROM landolphia;
GRANT ALL ON TABLE article_categories TO landolphia;
GRANT ALL ON TABLE article_categories TO web;

REVOKE ALL ON TABLE article_tags FROM PUBLIC;
REVOKE ALL ON TABLE article_tags FROM landolphia;
GRANT ALL ON TABLE article_tags TO landolphia;
GRANT ALL ON TABLE article_tags TO web;

REVOKE ALL ON TABLE articles FROM PUBLIC;
REVOKE ALL ON TABLE articles FROM landolphia;
GRANT ALL ON TABLE articles TO landolphia;
GRANT ALL ON TABLE articles TO web;

REVOKE ALL ON SEQUENCE articles_uid_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE articles_uid_seq FROM landolphia;
GRANT ALL ON SEQUENCE articles_uid_seq TO landolphia;
GRANT ALL ON SEQUENCE articles_uid_seq TO web;

REVOKE ALL ON TABLE author_roles FROM PUBLIC;
REVOKE ALL ON TABLE author_roles FROM landolphia;
GRANT ALL ON TABLE author_roles TO landolphia;
GRANT ALL ON TABLE author_roles TO web;

REVOKE ALL ON TABLE authors FROM PUBLIC;
REVOKE ALL ON TABLE authors FROM landolphia;
GRANT ALL ON TABLE authors TO landolphia;
GRANT ALL ON TABLE authors TO web;

REVOKE ALL ON TABLE categories FROM PUBLIC;
REVOKE ALL ON TABLE categories FROM landolphia;
GRANT ALL ON TABLE categories TO landolphia;
GRANT ALL ON TABLE categories TO web;

REVOKE ALL ON TABLE projects FROM PUBLIC;
REVOKE ALL ON TABLE projects FROM landolphia;
GRANT ALL ON TABLE projects TO landolphia;
GRANT ALL ON TABLE projects TO web;

REVOKE ALL ON TABLE roles FROM PUBLIC;
REVOKE ALL ON TABLE roles FROM landolphia;
GRANT ALL ON TABLE roles TO landolphia;
GRANT ALL ON TABLE roles TO web;

REVOKE ALL ON TABLE tags FROM PUBLIC;
REVOKE ALL ON TABLE tags FROM landolphia;
GRANT ALL ON TABLE tags TO landolphia;
GRANT ALL ON TABLE tags TO web;

REVOKE ALL ON SEQUENCE tags_uid_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE tags_uid_seq FROM landolphia;
GRANT ALL ON SEQUENCE tags_uid_seq TO landolphia;
GRANT ALL ON SEQUENCE tags_uid_seq TO web;
