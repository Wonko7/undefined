(ns undefined.views.news
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page article]]
        [noir.fetch.remotes]))

(defn news-page [name num]
  (let [title (if (= name "blog")
                "Undefined's Technical Blog"
                "Undefined's Latest News")]
    (page title (article "--title" "--date" "--article"))))

(add-page-init! "news" news-page)
(add-page-init! "blog" news-page)
