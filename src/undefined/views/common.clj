(ns undefined.views.common
  (:use [noir.fetch.remotes]
        ;[undefined.misc :only [doall-recur]]
        )
  (:require [net.cgrand.enlive-html :as html]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;  Page minimum:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(html/deftemplate base "templates/index.html"
  [content]
  [:title] (html/content "Undefined Development")
  [:#page-wrapper]  (html/append content))

(html/defsnippet page "templates/page.html" [:#page]
  [title content]
  [:#title]   (html/content title)
  [:#content] (html/append content))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;  Page composition:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(html/defsnippet article "templates/article.html" [:div.whole-article]
  [title date article]
  [:.article-title] (html/content title)
  [:.article-date]  (html/content date)
  [:.article]       (html/html-content article))

(html/defsnippet product "templates/product.html" [:div.whole-article]
  [title link article sc]
  [:.article-title :a]   (html/do-> (html/content title) (html/set-attr :href link))
  [:.product-desc]       (html/content article)
  [:.product-screenshot] (html/content "FIXME SCREENSHOT"))

(html/defsnippet login "templates/login.html" [:form]
  [])


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;  Page loading:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def page-inits {})

;; used by index.clj:
(def page-404 (page "404" {:tag :center :content [{:tag :img :attrs {:src "/img/404.jpg"}}]}))

(defremote get-page [href & [args]]
  (apply str (html/emit* (if-let [f (page-inits href)]
                           (f href args)
                           page-404))))

;; WARNING: not thread safe.
(defn add-page-init! [name func]
  (def page-inits (into page-inits {name func})))
