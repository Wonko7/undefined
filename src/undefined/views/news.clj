(ns undefined.views.index
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article]]
        ))

(defn news-page [name num]
  (let [title (if (= name "blog")
                "Undefined's Latest News"
                "Undefined's Technical Blog")]
    (println num)
    (page title (article "title" "date" "article"))
    ))

(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
