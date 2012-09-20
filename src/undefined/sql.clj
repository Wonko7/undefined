(ns undefined.sql
  ;(:require [net.cgrand.enlive-html :as html])
  (:require  [clojure.string :as string])
  (:use ;[noir.core :only [defpage]]
     ;[noir.statuses]
     ;[undefined.views.common :only [base page page-404]]
     [korma.db]
     [korma.core]))

(defdb undef-db (postgres {:db "undefined_bak"
                           :user "web"
                           :password "password" ;droptableusers"
                           ;;OPTIONAL KEYS
                           :host "127.0.0.1"
                           :port "5432"
                           :delimiters "" ;; remove delimiters
                           :naming {:keys string/lower-case
                                    ;; set map keys to lower
                                    :fields string/upper-case}}))

;TODO joins with cats, tags, authors
(defentity articles
  (table :articles)
  (entity-fields :uid :title :body :birth)
  (database undef-db))

(defentity tags
  (table :tags)
  (entity-fields :id :label)
  (database undef-db))

(defentity authors
  (table :authors)
  (entity-fields :name)
  (database undef-db))

(defentity categories
  (table :categories)
  (entity-fields :label)
  (database undef-db))

(defentity article_tags
  (table :article_tags)
  (entity-fields :artid :tagid)
  (database undef-db))

(defentity article_categories
  (table :article_categories)
  (entity-fields :artid :catid)
  (database undef-db))

(defentity article_authors
  (table :article_authors)
  (entity-fields :artid :authid)
  (database undef-db))

;TODO pre-weed out duplicate tags, get new tags id to link to article.
;TODO use maps to insert mutiple values for tags/cats/auths
;TODO transaction
;(defn add_article [title body authors categories tags]
;  (:pre [(not nil? title) (not nil? body) (not nil? authors) (not nil? categories) (not nil? tags)])
;  (let [newid (insert articles
;            (values {:title title :body body}))
;        newtag ()
;        authids ()
;        catids ()]
;        (insert article_authors
;            (values {:artid newid :authid authors}))
;    (insert article_tags
;            (values {:artid newid :tagid tags}))
;    (insert article_categories
;            (values {:artid newid :catid categories}))))

;TODO authors, cat, tags
(defn insert_article [title body] (insert articles
                                          (values {:title title :body body})))


;Starts here
;
;SELECT

;articles
(defn select_articles [off n]
  (select articles
          (limit n)
          (offset off)
          (order :birth :DESC)))

;tags
(defn select_tags []
  (select tags))

(defn tags_by_article [id]
  (select article_tags
          (where {:artid id})))

(defn tags_by_label [label]
  (select tags
          (where {:label [like (str "%" label "%")]})))

;categories
(defn select_categories []
  (select categories))

(defn categories_by_article [id]
  (select article_categories
          (where {:artid id})))

;authors
(defn select_authors []
  (select authors))

(defn authors_by_article [id]
  (select article_authors
          (where {:artid id})))

;INSERT

;UPDATE

;DELETE
