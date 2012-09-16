(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article]]
        [noir.fetch.remotes]))

(defn news-page [name number]
  (println number)
  (let [title (if (= name "blog")
                "Undefined's Technical Blog"
                "Undefined's Latest News")
        nbarticles 10]
    (page title (for [i (range nbarticles)]
                  (article (str "Title " i)
                           (str  i "/" i "/" i)
                           (apply str (repeat 500 (str " " i))))))))

(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
