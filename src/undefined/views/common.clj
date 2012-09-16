(ns undefined.views.common
  (:use [noir.fetch.remotes]
        ;[undefined.misc :only [doall-recur]]
        )
  (:require [net.cgrand.enlive-html :as html]))

(html/deftemplate base "templates/index.html"
  [content]
  [:title] (html/content "Undefined Development")
  [:#page-wrapper]  (html/append content))

(html/defsnippet article "templates/article.html" [:div.whole-article]
  [title date article]
  [:.article-title] (html/content title)
  [:.article-date]  (html/content date)
  [:.article]       (html/html-content article))

(html/defsnippet page "templates/page.html" [:#page]
  [title content]
  [:#title]   (html/content title)
  [:#content] (html/append content))

(def page-inits {})

(defremote get-page [href & [args]]
  (apply str (html/emit* (if-let [f (page-inits href)]
                           (f href args)
                           (page "404" {:tag :center :content [{:tag :img :attrs {:src "/img/404.jpg"}}]})))))

;; WARNING: not thread safe.
(defn add-page-init! [name func]
  (def page-inits (into page-inits {name func})))
