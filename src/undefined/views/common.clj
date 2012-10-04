(ns undefined.views.common
  (:use [noir.fetch.remotes]
        [undefined.auth :only [is-admin?]]
        [undefined.config :only [get-config]]
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

(defn set-attrs [data] ;; FIXME (into :attrs data) ?
  (apply html/do-> (map #(html/set-attr % (% data)) (keys data))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;  Page composition:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defsnippet-bind article "templates/article.html" [:div.whole-article]
  [uid category title date article tags authors is-admin?]
  [url (str (:domain (get-config)) "/" (name category) "-article/" uid)]

  [:div.whole-article]  (html/set-attr :id (str "article_" uid))
  [:.article-title :a]  (html/do-> (html/content title)
                                   (html/set-attr :href url)
                                   (html/set-attr :data-href (str (name category) "-article"))
                                   (html/set-attr :data-args (str uid)))
  ;[:.social :.href-set] (html/set-attr :href url) ;; FIXME for now unused, g+ was slow.
  [:.article-date]      (html/content date)
  [:.article]           (html/append article)
  [:.tags]              (html/content tags)
  [:.authors]           (html/content authors)
  [:.admin]             (html/append (if is-admin?
                                       [{:tag :button :attrs {:class "btn_upd" :value (str uid)} :content "Edit"}
                                        {:tag :button :attrs {:class "btn_del" :value (str uid)} :content "Delete"}])))

(html/defsnippet product "templates/product.html" [:div.whole-article]
  [title link article sc restrictions] ;; FIXME this is probably temporary. we need more usecases on restrictions to realise.
  [:.article-title :a]        (html/do-> (html/content title)
                                         (html/set-attr :href link)
                                         (html/set-attr :data-pre-exec restrictions))
  [:.product-desc]            (html/content article)
  [:.product-screenshot :img] (html/set-attr :src sc))

(html/defsnippet about "templates/about.html" [:.about]
  [])

(html/defsnippet login "templates/login.html" [:form]
  [])

(html/defsnippet newarticle "templates/new_article.html" [:form.newarticle]
  [authors categories title body tags uid sel_auths sel_cats]
  [:.inp_title]       (html/set-attr :value title)
  [:.txt_body]        (html/content body)
  [:.inp_tags]        (html/set-attr :value tags)
  [:.cbx_authors]     (html/html-content (options_list authors "cbx_auth" :name sel_auths))
  [:.cbx_categories]  (html/html-content (options_list categories "cbx_cat" :label sel_cats))
  [:.btn_add_article] (html/set-attr :value uid)
  [:.btn_rst]         (html/set-attr :value uid))

(html/defsnippet metadata "templates/metadata.html" [:#metadata]
  [data]
  [:#metadata] (set-attrs data))

(html/defsnippet right-content "templates/right-content.html" [:#right-content]
  [static-links tags]
  [:ul.static-links] (html/append static-links)
  [:ul.tags]         (html/append tags))

(html/defsnippet li-link "templates/right-content.html" [:li]
  [title attrs]
  [:li :a] (html/do->
             (set-attrs attrs)
             (html/content title)))


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

(defmacro add-page-init! [name fun & [arg]]
  `(do
     (register-page-init! ~name ~fun)
     ~(if arg
        `(defpage ~(str "/" name "/:" arg ) {:keys [~(symbol arg)]}
           (base (~fun (session/get :id) ~name ~(symbol arg))))
        `(defpage ~(str "/" name) []
           (base (~fun (session/get :id) ~name nil))))))
