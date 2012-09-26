(ns undefined.sql
  (:require  [clojure.string :as string])
  (:use [noir.fetch.remotes]
     [korma.db]
     [korma.core]
     [undefined.auth :only [is-admin?]]))


(defdb undef-db (postgres {:db "undefined"
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
;TODO sort by remotes/fns

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

;SELECT

(defn select_articles [off n cat]
  (select article_categories
          (fields :articles.title :articles.body :articles.birth :articles.uid)
          (join articles (= :article_categories.artid :articles.uid))
          (join categories (= :categories.uid :article_categories.catid))
          (limit n)
          (offset off)
          (where {:categories.label cat})
          (order :articles.birth :DESC)))

(defn select_article [id]
  (select article_categories
          (fields :articles.title :articles.body :articles.birth :articles.uid)
          (join articles (= :article_categories.artid :articles.uid))
          (join categories (= :categories.uid :article_categories.catid))
          (modifier "distinct")
          (where {:artid id})
          (order :articles.birth :DESC)))

(defn select_tags []
  (select tags))

(defn tags_by_article [id]
  (select article_tags
          (fields :tags.label)
          (join tags)
          (where {:artid id})))

(defn tags_by_label [label]
  (select tags
          (where {:label [like (str "%" label "%")]})))

(defn select_categories []
  (select categories))

(defn categories_by_article [id]
  (select article_categories
          (fields :categories.label)
          (join categories)
          (where {:artid id})))

(defn select_authors []
  (select authors))

(defn authors_by_article [id]
  (select article_authors
          (fields :authors.name)
          (join authors)
          (where {:artid id})))


;INSERT

;TODO this has to be prettyfiable
(defn weed_tags [tag_input artid]
  (let [tag_array       (distinct (clojure.string/split tag_input #" "))
        existing_tags   (map #(:label %) (select_tags))
        filtered_tags   (clojure.set/difference (set tag_array) (set existing_tags))
        get_tagid       (fn [x] (str (:uid ((select tags
                                                    (fields :uid :label)
                                                    (where {:label x})) 0))))]
    (doseq [x filtered_tags] (insert tags (values {:label x})))
    (doseq [x tag_array] (insert article_tags (values {:artid artid :tagid (Integer/parseInt (get_tagid x))})))))


;TODO transaction
;TODO beautify doseq
(defn insert_article [title body tags authors categories]
  (if (is-admin?)
    (let [artid     (:uid (insert articles (values {:title title :body body})))
          get_keys  (fn [m] (keys (select-keys m (for [[k v] m :when (= v true)] k))))
          auths     (get_keys authors)
          cats      (get_keys categories)]
      (doseq [x auths]  (insert article_authors     (values {:artid artid :authid (Integer/parseInt x)})))
      (doseq [x cats]   (insert article_categories  (values {:artid artid :catid (Integer/parseInt x)})))
      (weed_tags tags artid)
      artid)))


;UPDATE
;TODO don't delete/re-insert tags
(defn update_article [uid title body tags]
  (if (is-admin?)
    (transaction
      (update articles
              (set-fields {:title title :body body})
              (where {:articles.uid uid}))
      (delete article_tags
              (where {:artid uid}))
      (weed_tags tags uid))))


;DELETE
(defn delete_article [uid]
  (if (is-admin?)
    (delete articles
            (where {:uid uid}))))


;; Remotes

(defremote insert_article_rem [title body tags authors categories] (insert_article title body tags authors categories))
(defremote update_article_rem [uid title body tags] (update_article (int uid) title body tags))
(defremote tags_by_article_rem [id] (tags_by_article (int id)))
(defremote select_article_rem [id] (select_article (int id)))
(defremote delete_article_rem [uid] (delete_article (int uid)))
(defremote select_authors_rem [] (select authors))
(defremote select_categories_rem [] (select categories))
