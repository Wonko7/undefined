(ns undefined.views.common
  (:use [noir.fetch.remotes]
        [undefined.auth :only [is-admin?]]
        [undefined.config :only [get-config]]
        [undefined.misc :only [from_html]]
        [noir.core :only [defpage]]
        [undefined.misc :only [options_list]])
  (:require [net.cgrand.enlive-html :as html]
            [noir.session :as session]))


(defmacro defsnippet-bind ;; FIXME this should be a lot simpler
  [name source selector args bindings & forms]
  `(defn ~name ~args
     (let ~bindings
       (apply (html/snippet ~source ~selector [ ~@(concat args (keep-indexed #(when (even? %1) %2) bindings)) ] ~@forms)
              [ ~@(concat args (keep-indexed #(when (even? %1) %2) bindings)) ]))))

(defn set-attrs [data]
  (when data
    (apply html/set-attr (apply concat data))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;  Page composition:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defsnippet-bind article "templates/article.html" [:div.whole-article]
  [uid category is-admin? title date article tags authors comment_count comments]
  [url (str "/" (name category) "-article/" uid)]

  [:div.whole-article]  (html/set-attr :id (str "article_" uid))
  [:.article-title :a]  (html/do-> (html/content title)
                                   (html/set-attr :href url))
  ;[:.social :.href-set] (html/set-attr :href url) ;; FIXME for now unused, g+ was slow.
  [:.article-date]      (html/content date)
  [:.article]           (html/append article)
  [:.tags]              (html/append tags)
  [:.authors]           (html/content authors)
  [:.admin]             (html/append (when is-admin?
                                       [{:tag :button :attrs {:class "btn_upd btn_upd_c_and_a" :value (str uid)} :content "Edit"}
                                        {:tag :button :attrs {:class "btn_del btn_del_c_and_a" :value (str uid)} :content "Delete"}]))
  [:.comment-count :a]  (html/do-> (html/content comment_count)
                                   (html/set-attr :href url))
  [:.comments]          (html/append comments))

(html/defsnippet user-comment "templates/article.html" [:div.comment_wrapper]
  [uid is-admin? author date-birth date-edit comment]
  [:.comment_wrapper] (html/set-attr :id (str "comment_" uid))
  [:.author]          (html/content author)
  [:.date-birth]      (html/content (str "Added: " date-birth))
  [:.date-edit]       (html/content (when date-edit (str " - Edited: " date-edit)))
  [:.content]         (html/content comment)
  [:.edit]            (html/append (when is-admin?
                                     [{:tag :button :attrs {:class "btn_upd_comment btn_upd_c_and_a" :value (str uid)} :content "Edit"}
                                      {:tag :button :attrs {:class "btn_del_comment btn_del_c_and_a" :value (str uid)} :content "Delete"}])))

(html/defsnippet project "templates/project.html" [:div.whole-article]
  [title link article sc restrictions] ;; FIXME this is probably temporary. we need more usecases on restrictions to realise.
  [:.article-title :a]        (html/do-> (html/content title)
                                         (html/set-attr :href link)
                                         (html/set-attr :data-pre-exec restrictions))
  [:.project-desc]            (html/content article)
  [:.project-screenshot :img] (if (and sc (not= sc ""))
                                (html/set-attr :src sc)
                                (html/add-class "hidden")))

(html/defsnippet about "templates/about.html" [:.about]
  [])

(html/defsnippet login "templates/login.html" [:form.login]
  [])

(html/defsnippet profile "templates/login.html" [:div.profile]
  [name mail]
  [:.profile :.username]      (html/content name)
  [:.profile :.current-email] (html/do-> (html/set-attr :href (str "mailto:" mail))
                                         (html/content mail)))

(html/defsnippet sign-up "templates/login.html" [:div.sign-up]
  [])

(html/defsnippet new-article "templates/new_article.html" [:form.newarticle]
  [authors categories title body tags uid sel_auths sel_cats]
  [:.inp_title]       (html/set-attr :value title)
  [:.txt_body]        (html/content body)
  [:.inp_tags]        (html/set-attr :value tags)
  [:.cbx_authors]     (html/html-content (options_list authors "cbx_auth" :username sel_auths))
  [:.cbx_categories]  (html/html-content (options_list categories "cbx_cat" :label sel_cats))
  [:.btn_add_article] (html/set-attr :value uid)
  [:.btn_rst]         (html/set-attr :value uid))

(html/defsnippet new-comment "templates/new_article.html" [:form.new-comment]
  [article-id comment-id body]
  [:form]             (html/set-attr :data-article-id article-id)
  [:button]           (html/set-attr :value comment-id :data-article-id article-id)
  [:.txt_body]        (html/content (from_html body)))

(html/defsnippet please-log-in "templates/new_article.html" [:div.please-log-in-wrapper]
  [])

(html/defsnippet metadata "templates/metadata.html" [:#metadata]
  [data]
  [:#metadata] (set-attrs data))

(html/defsnippet li-link "templates/right-content.html" [:li]
  [title attrs]
  [:li :a] (html/do->
             (set-attrs attrs)
             (html/content title)))

(html/defsnippet a-link "templates/right-content.html" [:li :a]
  [title attrs]
  [:a] (html/do->
         (set-attrs attrs)
         (html/content title)))

(html/defsnippet right-content "templates/right-content.html" [:#right-content]
  [static-links tags]
  [:ul.login]        (html/append (li-link "Log In" {:href "login"}))
  [:ul.static-links] (html/append static-links)
  [:ul.tags]         (html/append tags))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;  Page skeleton:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(declare page-inits)

(html/deftemplate base "templates/index.html"
  [content]
  [:.admin]              (html/add-class "hidden")
  [:title]               (html/content "Undefined Development")
  [:#page-wrapper]       (html/append content)
  [:#page-right-wrapper] (html/append ((page-inits "right-content") nil "right-content" nil)))

(html/defsnippet page "templates/page.html" [:#page]
  [title content & [optional]]
  [:#title]   (html/content title)
  [:#content] (html/do-> (html/append content)
                         (html/append (metadata (:metadata optional))))
  [:#bottom]  (html/append (:bottom optional)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;  Atom page:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(html/defsnippet atom-feed "templates/atom.xml" [:feed]
  [title link feed-link date content]
  [:title]         (html/content title)
  [:id]            (html/content link)
  [:link#feed-url] (html/do-> (html/set-attr :href feed-link)
                              (html/remove-attr :id))
  [:link#site-url] (html/do-> (html/set-attr :href link)
                              (html/remove-attr :id))
  [:updated]       (html/do-> (html/content date)
                              (html/after content)))

(html/defsnippet atom-entry "templates/entry.xml" [:entry]
  [title link date article authors]
  [:title]         (html/content title)
  [:id]            (html/content link)
  [:link]          (html/set-attr :href link)
  [:updated]       (html/content date)
  [:content]       (html/do-> (html/content article)
                              (html/after authors)))

(html/defsnippet atom-authors "templates/entry.xml" [:author]
  [name]
  [:name] (html/content name))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;  Page loading:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def page-inits {})

;; used by index.clj:
(def page-404 (page "404"
                    {:tag :div :attrs {:class "whole-article"}
                     :content [{:tag :center :content [{:tag :img :attrs {:src "/img/deadlink.png"}}]}]}
                    {:metadata {:data-init-page "404"}}))

(defremote get-page [href & [args]]
  (apply str (html/emit* (if-let [f (page-inits href)]
                           (f (session/get :id) href args)
                           page-404))))

;; WARNING: not thread safe.
(defn register-page-init! [name func]
  (def page-inits (into page-inits {name func})))

(defmacro add-page-init! [name fun & [nb-args]]
  `(do
     (register-page-init! ~name ~fun)
     ~(if nb-args
        (let [args (map #(str "id" %) (range nb-args))
              syms (map symbol args)]
          `(defpage ~(str "/" name "/:" (apply str (interpose "/:" args))) {:keys [~@syms]}
             (base (~fun (session/get :id) ~name [~@syms]))))
        `(defpage ~(str "/" name) []
           (base (~fun (session/get :id) ~name nil))))))
