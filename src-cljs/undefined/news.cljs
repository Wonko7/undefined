(ns undef.news
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em])
  (:use [undef.pages :only [add-page-init! page-click]]))

(defn newspage [href & [args]]
  (em/at js/document
      [:.btn_del] (em/listen :click (fn [e]
                                      (let [uid (em/from (.-currentTarget e) (em/get-attr :value))]
                                        (if (js/confirm (str "This will PERMANENTLY erase the article #" uid " from the database."))
                                          (fm/letrem [res (delete_article_rem uid)] (em/at js/document [(str ":#article_" uid)] (em/substitute "")))))))
      [:.btn_upd] (em/listen :click (fn [e]
                                      (let [uid    (int (em/from (.-currentTarget e) (em/get-attr :value)))
                                            sel    (str ":#article_" uid)]
                                        (fm/letrem [div (get-page "news-update-article-div" uid)]
                                            (em/at js/document
                                                [sel] (em/html-content div)
                                                [:form] (em/listen :submit
                                                            (fn [e]
                                                              (.preventDefault e)
                                                              (let [newtitle (em/from (em/select [(str sel " .inp_title" )])  (em/get-prop :value))
                                                                    newbody  (em/from (em/select [(str sel " .txt_body" )])   (em/get-prop :value))
                                                                    newtags  (em/from (em/select [(str sel " .inp_tags" )])   (em/get-prop :value))]
                                                                (js/console.log (str "UID#" uid " SEL[" sel
                                                                                  "]\nTitle: "newtitle"\nBody: "newbody"\nTags: " newtags))
                                                                (fm/letrem [res (update_article_rem uid newtitle newbody newtags)
                                                                            div (get-page "news-refresh-article-div" uid)]
                                                                    (em/at js/document [sel] (em/substitute div))
                                                                    (newspage href args))))))))))));FIXME only refresh the new buttons?

(add-page-init! "news" newspage)
