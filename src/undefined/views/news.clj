(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article]]
        [noir.fetch.remotes]))

(defn news-page [name article-id]
  (let [title        (if (= name "blog")
                       "Undefined's Technical Blog"
                       "Undefined's Latest News")
        nb-articles  10
        article-id   (if article-id (Integer. article-id) 0) ;; FIXME add contracts on this. people can feed whatever here
        article-stop (+ article-id 10)
        article-prev (- article-id 10)
        article-prev (if (pos? article-prev) article-prev 0)
        blognav      [{:tag :a :attrs {:href name :data-args article-prev} :content "Previous"} ;; FIXME: make something more generic
                      {:tag :a :attrs {:href name :data-args article-stop :style "float: right"} :content "Next"}]]
    (page title
          (for [i (range article-id article-stop)]
                  (article (str name "Title " i)
                           (str  i "/" i "/" i)
                           (apply str (repeat 500 (str " " i)))))
          {:bottom blognav})))

(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
