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

(defentity tags
  (table :tags)
  (pk :uid)
  (entity-fields :id :label)
  (database undef-db))

(defentity authors
  (table :authors)
  (pk :uid)
  (entity-fields :name)
  (database undef-db))

(defentity categories
  (table :categories)
  (pk :uid)
  (entity-fields :label)
  (database undef-db))

(defentity article_tags
  (table :article_tags)
  (pk :tagid)
  (has-many tags {:fk :uid})
  (entity-fields :artid :tagid)
  (database undef-db))

(defentity article_categories
  (table :article_categories)
  (pk :catid)
  (has-many categories {:fk :uid})
  (entity-fields :artid :catid)
  (database undef-db))

(defentity article_authors
  (table :article_authors)
  (pk :authid)
  (has-many authors {:fk :uid})
  (entity-fields :artid :authid)
  (database undef-db))

(defentity articles
  (table :articles)
  (pk :uid)
  (entity-fields :uid :title :body :birth)
  (database undef-db))

;DRAFT-->
;TODO authors, cat, tags
(defn insert_article [title body] (insert articles
                                          (values {:title title :body body})))
;-->DRAFT


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
          (fields :tags.label)
          (join tags)
          (where {:artid id})))

(defn tags_by_article2 [id]
  (select article_tags
          (fields :tags.label)
          (join tags)
          (transform #(str "test"(:tags.label %)))
          (where {:artid id})))

(defn tags_by_label [label]
  (select tags
          (where {:label [like (str "%" label "%")]})))

;categories
(defn select_categories []
  (select categories))

(defn categories_by_article [id]
  (select article_categories
          (fields :categories.label)
          (join categories)
          (where {:artid id})))

;authors
(defn select_authors []
  (select authors))

(defn authors_by_article [id]
  (select article_authors
          (fields :authors.name)
          (join authors)
          (where {:artid id})))

;INSERT

;UPDATE

;DELETE
