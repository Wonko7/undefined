(ns undefined.sql
  (:refer-clojure :exclude [extend])
  (:require [clojure.string :as string]
            [clj-time.format :as time-format]
            [noir.session :as session]
            [noir.util.crypt :as nc]
            [korma.sql.engine :as eng])
  (:use [clj-time.core]
        [undefined.config :only [get-config]]
        [undefined.misc   :only [get_keys
                                 send_email
                                 to_html]]
        [noir.fetch.remotes]
        [korma.db]
        [korma.core]
        [undefined.content :only [str-to-int url-encode url-decode]]
        [undefined.auth :only [is-admin? is-author? userid]]))

(defdb undef-db (postgres {:db "undefined"
                           :user "web"
                           :password "password"
                           ;;OPTIONAL KEYS
                           :host "127.0.0.1"
                           :port "5432"
                           :delimiters "" ;; remove delimiters
                           :naming {:keys string/lower-case
                                    ;; set map keys to lower
                                    :fields string/upper-case}}))

(defn init-db-connection
  "Defines the database connection to use from within Clojure."
  [config]
  (def undef-db (create-db (postgres {:db (:database config)
                                      :user "web"
                                      :password (:db-pass config)
                                      ;;OPTIONAL KEYS
                                      :host "127.0.0.1"
                                      :port "5432"
                                      :delimiters "" ;; remove delimiters
                                      :naming {:keys string/lower-case
                                               ;; set map keys to lower
                                               :fields string/upper-case}})))
  (default-connection undef-db))


(defentity projects
  (table :projects)
  (pk :uid)
  (entity-fields :uid :title :description :link :screenshot :pin)
  (database undef-db))

(defentity comments
  (table :comments)
  (pk :uid)
  (entity-fields :uid :content :authid :artid :birth :edit)
  (database undef-db))

(defentity tags
  (table :tags)
  (pk :uid)
  (entity-fields :id :label)
  (database undef-db))

(defentity authors
  (table :authors)
  (pk :uid)
  (entity-fields :username :email :birth)
  (database undef-db))

(defentity reset_links
  (table :reset_links)
  (fields :userid :resetlink :birth)
  (pk :uid))

(defentity newemail_links
  (table :newemail_links)
  (fields :userid :updatelink :birth)
  (pk :uid))

(defentity temp_authors
  (table :temp_authors)
  (pk :uid))

(defentity roles
  (table :roles)
  (pk :uid)
  (entity-fields :uid :label)
  (database undef-db))

(defentity categories
  (table :categories)
  (pk :uid)
  (entity-fields :label)
  (database undef-db))

(defentity author_roles
  (table :author_roles)
  (pk :roleid)
  (has-many roles   {:fk :uid})
  (entity-fields :roles.label))

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


;;;;;;;;;;;;;
;; Helpers ;;
;;;;;;;;;;;;;

;TODO add to_psql_time wrapper (js+time-format+time-zone?)

(defn ilike [k v]
  (eng/infix k "ILIKE" v))

;(def psqltime (time-format/formatter "yyyy-MM-dd HH:mm:ss"))

(defn psqltime [t] (java.sql.Timestamp/valueOf
                     (time-format/unparse
                       (time-format/formatter "yyyy-MM-dd HH:mm:ss")
                       t)))

(defn flush_temp_tables []
  (let [treshold (minus (now) (days 1) (hours -2))]
    (transaction
      (delete temp_authors
              (where {:birth [< (psqltime treshold)]}))
      (delete reset_links
              (where {:birth [< (psqltime treshold)]}))
      (delete newemail_links
              (where {:birth [< (psqltime treshold)]})))))

(defn is-email-available? [email & change]
  (do
    (flush_temp_tables)
    (let [[users]     (select authors (where {:email email}))
          [newmail]   (select newemail_links (where {:newemail email}))
          [tempusers] (select temp_authors (where {:email email}))]
      (not (or users newmail (and change tempusers))))))

;SELECT
;
(defn articles_by_tags [id off n]
  (select article_tags
          (fields [:article_tags.artid :uid]
                  [:articles.title :title] [:articles.body :body] [:articles.birth :birth])
          (join articles (= :articles.uid :article_tags.artid))
          (where {:article_tags.tagid id})
          (limit n)
          (offset off)
          (order :articles.birth :DESC)))

(defn select_articles [off n cat]
  (select article_categories
          (fields :articles.title :articles.body :articles.birth :articles.uid)
          (join articles (= :article_categories.artid :articles.uid))
          (join categories (= :categories.uid :article_categories.catid))
          (limit n)
          (offset off)
          (where {:categories.label cat})
          (order :articles.birth :DESC)))

(defn comment_count [& {:keys [comment article] :or {comment nil article nil}}]
  (let [artid (if article
                article
                (:artid (first (select comments
                                       (where {:uid comment})))))]
    (select comments
            (aggregate (count :*) :cnt)
            (where {:artid artid}))))

(defn select_article [id]
  (select article_categories
          (fields :articles.title :articles.body :articles.birth :articles.uid)
          (join articles (= :article_categories.artid :articles.uid))
          (join categories (= :categories.uid :article_categories.catid))
          (modifier "distinct")
          (where {:artid id})
          (order :articles.birth :DESC)))

(defn tag_cloud []
  (select article_tags
          (fields :tags.label :tags.uid)
          (group :tags.label :tags.uid)
          (aggregate (count :*) :cnt :tags.label)
          (join tags (= :tags.uid :article_tags.tagid))))

(defn select_tags [& [id]]
  (if id
    (select tags
            (where {:uid id}))
    (select tags)))

(defn tags_by_article [id]
  (select article_tags
          (fields :tags.uid :tags.label)
          (join tags)
          (where {:artid id})))

(defn tags_by_label [label]
  (select tags
          (where {:label [like (str "%" label "%")]})))

(defn select_categories [] (select categories))

(defn categories_by_article [id]
  (select article_categories
          (fields :categories.label)
          (join categories)
          (where {:artid id})))

(defn select_authors []
  (select authors
          (join author_roles  (= :author_roles.authid :authors.uid))
          (join roles         (= :author_roles.roleid :roles.uid))
          (where {:roles.label "admin"})))

(defn authors_by_article [id]
  (select article_authors
          (fields :authors.username :authors.email)
          (join authors)
          (where {:artid id})))

(defn get_user [& {:keys [id username email] :or {id nil username nil email nil}}]
  (let [stat (if username   {:username [ilike username]}  
               (if id          {:authors.uid id}
                 {:email [ilike email]}))]
    (select authors
            (join author_roles (= :author_roles.authid :authors.uid))
            (join roles (= :roles.uid :author_roles.roleid))
            (fields [:authors.uid :uid] [:authors.username :username] [:authors.password :pass] [:authors.email :email]
                    [:authors.salt :salt] [:roles.label :roles])

            (where stat))))

(defn select_projects [] (select projects))

(defn get_user_roles [id]
  (select author_roles
          (fields :roles.label)
          (join roles)
          (where {:authid id})))

(defn is_user_admin? [id]
  (select author_roles
          (join roles)
          (where {:authid id
                  :roles.label "Admin"})))

(defn comments_by_article [id]
  (select comments
          (fields :uid :content [:authors.username :author] [:authors.uid :authid] :birth :edit)
          (join authors (= :authors.uid :comments.authid))
          (aggregate (count :*) :cnt :comments.uid)
          (group :authors.username :birth :edit :authors.uid :content)
          (order :birth :ASC)
          (where {:artid id})))

;;;;;;;;;;;;
;; SIGNUP ;;
;;;;;;;;;;;;

(defn promote_temp_user [username]
  (let [newuser (first (select temp_authors (where {:username username})))
        user  (insert  authors
                      (values {:username (:username newuser)
                               :email    (:email newuser)
                               :password (:password newuser)
                               :salt     "NO SALT"
                               :birth    (:birth newuser)}))
        [role]  (select   roles
                        (where {:label "peon"}))]
    (do
      (insert author_roles
              (values {:authid (:uid user)
                       :roleid (:uid role)}))
      (delete temp_authors (where {:username username})))))

(defn get_temp_user [& {:keys [username email] :or {username nil email nil}}]
  (if username
    (select temp_authors (where {:username  username}))
    (select temp_authors (where {:email     email}))))

(defn activate_user [link]
  (do
    ;(println (str "\n\nValidation token: " (first link) "\n\n"))
    (flush_temp_tables)
    (let [res (first (select temp_authors (where {:activation (first link)})))]
      (if res
        (do
          (promote_temp_user (:username res))
          "The account has been succesfully activated")
        "This link is not valid."))))

(defn create_temp_user [username email password]
  (if (> (.-length username) 50)
    "Your username is too long (> 50 characters)."
    (if (first (get_user :username username))
      "This username isn't available anymore."
      (if (is-email-available? email);(first (get_user :email email))
        (do
          (flush_temp_tables)
          (delete temp_authors (where {:username username})) 
          (delete temp_authors (where {:email email}))
          (let [birth (psqltime (from-time-zone (now) (time-zone-for-offset -2)))
                act   (nc/encrypt (str username email birth))]
            ;(println (url-encode act))
            (insert temp_authors
                    (values {:username    username
                             :email       email
                             :password    (nc/encrypt password)
                             :salt        "NO SALT"
                             :birth       birth
                             :activation  act}))
            (do
              (let [res           (send_email :activation email (url-encode act))
                    [error code]  [(:error res) (:code res)]]
                (if (= :SUCCESS error)
                  0
                  (str "There was an error sending your activation link.[" error ", "code "]"))))))
        "This email has already been used to create an account."))))

(defn update_password [username oldpass newpass]
  (let [[user] (select authors (where {:username username}))]
    (if user
      (if (nc/compare oldpass (:password user))
        (do
          (transaction
            (delete reset_links
                    (where {:userid (:uid user)}))
            (update authors
                    (set-fields {:password (nc/encrypt newpass)})
                    (where {:uid (:uid user)})))          
          "Your password has been succesfully updated.")
        "Your current password is incorrect.")
      "Your password couldn't be updated.")))

;;;;;;;;;;;;;;;;;;;;
;; Reset password ;;
;;;;;;;;;;;;;;;;;;;;

(defn reset_pass [newpass token]
  (let [[res]     (select reset_links
                          (where {:resetlink token}))
        userid  (:userid res)]
    (if res 
      (do
        (flush_temp_tables)
        (transaction
          (delete reset_links
                  (where {:userid userid}))
          (update authors
                  (set-fields {:password (nc/encrypt newpass)})
                  (where {:uid userid})))
        "Your password has been updated.")
      "Your password could not be updated.")))

;Erases any previous demands made for the same user
(defn store_reset_link [userid link]
  (do
    (flush_temp_tables)
    (transaction
      (delete reset_links
              (where {:userid userid}))
      (insert reset_links
              (values {:userid userid :resetlink link})))))

(defn check_reset_token [token]
  (let [[res] (select reset_links
                      (where {:resetlink (first token)}))]
    (if res
      (select authors
              (where {:uid (:userid res)}))
      -1)))

(defn reset_password [username]
  (let [[user] (select authors (where {:username [ilike username]}))
        resetlink (when user
                    (nc/encrypt (str (:uid user) (:username user) (:password user) (now))))]
    (if resetlink
      (do
        (store_reset_link (:uid user) resetlink)
        (send_email :reset (:email user) (url-encode resetlink))
        "An email with instructions to reset your password has been sent (check your spam folder).")
      "There's been an issue sending your reset link.")))

;;;;;;;;;;;;;;;;;;
;; Update Email ;;
;;;;;;;;;;;;;;;;;;

(defn update_email [userid newemail]
  (transaction
    (update authors
            (set-fields {:email newemail})
            (where {:uid userid}))
    (delete newemail_links
            (where {:userid userid}))))

(defn check_update_email_token [link]
  (do
    (flush_temp_tables)
    (let [res (first (select newemail_links (where {:updatelink (first link)})))]
      (if res
        (do
          (update_email (:userid res) (:newemail res))
          "Your email address has been updated.")
        "This link is not valid."))))

(defn create_new_email_token [username password newmail]
  (let  [[user] (get_user :username username)
         birth  (psqltime (from-time-zone (now) (time-zone-for-offset -2)))
         act    (nc/encrypt (str username newmail birth))]
    (if user
      (if (nc/compare password (:pass user))
        (if (is-email-available? newmail true);(first (get_user :email newmail))
          (do
            (transaction
              (delete newemail_links
                      (where {:userid (:uid user)}))
              (insert newemail_links
                      (values {:userid      (:uid user)
                               :newemail    newmail
                               :birth       birth
                               :updatelink  act})))
            (let [res (send_email :change newmail (url-encode act))
                  [error code]  [(:error res) (:code res)]]
              (if (= :SUCCESS error)
                "A confirmation link was sent to your email. You can restart the process if you didn't get the email (check your spam folder)."
                (str "There was an error sending your confirmation link.[" error ", "code "]"))))
          "This email has already been used to create an account.")
        "Your password is incorrect.")
      "This user doesn't exist.")))

;INSERT

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
(defn insert_article [current-id title body tags authors categories]
  (if (is-admin? current-id)
    (let [artid     (:uid (insert articles (values {:title title :body body})))
          auths     (get_keys authors)
          cats      (get_keys categories)]
      (doseq [x auths]  (insert article_authors     (values {:artid artid :authid (Integer/parseInt x)})))
      (doseq [x cats]   (insert article_categories  (values {:artid artid :catid (Integer/parseInt x)})))
      (weed_tags tags artid)
      artid)))

(defn insert_comment [id author content]
  (if (< (.length content) 10001)
    (if (userid author)
      (let [res (insert comments (values {:artid id :authid (userid author) :content (to_html content)}))]
        (:uid res)))
    -1))

;UPDATE
;TODO don't delete/re-insert tags/cats/auths
;TODO actually... would there be that much of a perf improvement..? isn't it worse to check for existing values?
(defn update_article [current-id uid title body tags authors categories]
  (if (is-admin? current-id)
    (let [auths     (get_keys authors)
          cats      (get_keys categories)]
      (transaction
        (update articles
                (set-fields {:title title :body body})
                (where {:articles.uid uid}))
        (delete article_tags
                (where {:artid uid}))
        (delete article_authors
                (where {:artid uid}))
        (delete article_categories
                (where {:artid uid}))
        (weed_tags tags uid)
        (doseq [x auths]  (insert article_authors     (values {:artid uid :authid (Integer/parseInt x)})))
        (doseq [x cats]   (insert article_categories  (values {:artid uid :catid (Integer/parseInt x)})))))))

(defn select_comment [uid]
  (select comments
          (where {:uid uid})
          (order :birth :ASC)))

(defn update_comment [userid uid content]
  (let [[com] (select comments (where {:uid uid}))]
    (if (or (is-author? userid (:authid com)) (is-admin? userid))
      (update comments
              (set-fields {:content (to_html content) :edit (psqltime (from-time-zone (now) (time-zone-for-offset -2)))})
              (where {:uid uid})))))

;DELETE
(defn delete_article [id uid]
  (if (is-admin? id)
    (delete articles
            (where {:uid uid}))))

(defn delete_comment [id uid]
  (let [[com] (select comments (where {:uid uid}))]
    (if true; (or (is-author? id (:authid com)) (is-admin? id))
      (:artid (delete comments
                      (where {:uid uid}))))))

(defn delete_account [username password]
  (let [[user] (get_user :username username)]
    (if user
      (if (nc/compare password (:pass user))
        (do
          (transaction
            (delete comments
                    (where {:authid (:uid user)}))
            (delete authors
                    (where {:username username})))
          1)
        "Your password is incorrect")
      "This user doesn't exist")))

;; Remotes

(defremote insert_article_rem [title body tags authors categories]
  (insert_article (session/get :id) title body tags authors categories))

(defremote update_article_rem [uid title body tags authors categories]
  (update_article (session/get :id) (str-to-int uid) title body tags authors categories))

(defremote insert_comment_rem [artid content]
  (insert_comment (str-to-int artid) (session/get :id) content))

(defremote update_comment_rem [comid content]
  (update_comment (session/get :id) comid content))

(defremote delete_rem [type uid]
  (let [id (session/get :id)]
    (if (= type :article)
      (delete_article id (str-to-int uid))
      (delete_comment id (str-to-int uid)))))

(defremote update_pass_rem [id oldpass newpass] (update_password id oldpass newpass))
(defremote reset_pass_rem [username] (reset_password username))

(defremote request_email_token_rem [username password newemail] (create_new_email_token username password newemail))

(defremote delete_account_rem [username password] (delete_account username password))

(defremote reset_pass2_rem [newpass token] (reset_pass newpass token))

;(defremote tag_cloud_rem [] (tag_cloud))
