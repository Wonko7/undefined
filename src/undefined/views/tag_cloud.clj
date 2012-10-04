(ns undefined.views.tag-cloud
  (:use [undefined.views.common :only [li-link right-content add-page-init!]]
        [undefined.config :only [get-config]]
        [undefined.sql :only [tag_cloud]]))

(defn right-content-page [id href args] ;; warning; id always nil. fix in common if needed.
  (let [url (:domain (get-config))]
   (right-content (map #(apply li-link %) [["News Feed" {:href (str url "/news-feed")
                                                         :data-ext "true"}]
                                           ["Blog Feed" {:href (str url "/blog-feed")
                                                         :data-ext "true"}]])
                  (map #(li-link (:label %) {:href (str "/tag/" (:tagid %))
                                             :data-href "tag"
                                             :data-args (str (:tagid %))})
                       (tag_cloud)
                       )))) ;; FIXME we need a limit

(add-page-init! "right-content" right-content-page)
