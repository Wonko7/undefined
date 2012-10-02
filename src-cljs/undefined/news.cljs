(ns undef.news
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef]
            [goog.style :as style])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em])
  (:use [undef.pages :only [add-page-init! page-click]]))


(defn newspage [href & [args]]
  (em/at js/document
         [:.btn_del] (em/do->
                       (em/remove-listener :click)
                       (em/listen :click (fn [e]
                                           (let [uid (em/from (.-currentTarget e) (em/get-attr :value))]
                                             (when (js/confirm (str "This will PERMANENTLY erase the article #" uid " from the database."))
                                               (fm/letrem [res (delete_article_rem uid)]
                                                 (em/at js/document [(str ":#article_" uid)] (em/substitute ""))))))))
         [:.btn_upd] (em/do->
                       (em/remove-listener :click)
                       (em/listen :click (fn [e]
                                           (let [uid    (int (em/from (.-currentTarget e) (em/get-attr :value)))
                                                 sel    (keyword (str "#article_" uid))]
                                             (fm/letrem [div (get-page "news-update-article-div" uid)]
                                               (em/at js/document
                                                      [sel]  (em/chain
                                                               (em/resize :curwidth 0 200)
                                                               (em/html-content div)
                                                               #(let [h (:size (em/from js/document
                                                                                        :size [sel :form] (fn [node]
                                                                                                            (let [padd ((ef/extr-multi-node style/getMarginBox) node)
                                                                                                                  marg ((ef/extr-multi-node style/getPaddingBox) node)
                                                                                                                  bord ((ef/extr-multi-node style/getBorderBox) node)
                                                                                                                  size ((ef/extr-multi-node style/getSize) node)]
                                                                                                              (+ (.-top padd) (.-bottom padd) (.-top marg) (.-bottom marg) (.-top bord) (.-bottom bord) (.-height size))) 
                                                                                                            )))]
                                                                  ;(js/console.log (str sz) (:height (.-height sz)))
                                                                  (js/console.log h )
                                                                  (apply (em/resize :curwidth h 200) %&)))
                                                      [:form] (em/listen :submit
                                                                         (fn [e]
                                                                           (.preventDefault e)
                                                                           (let [article (em/from js/document
                                                                                                  :title     [sel :.inp_title] (em/get-prop :value)
                                                                                                  :body      [sel :.txt_body]  (em/get-prop :value)
                                                                                                  :tags      [sel :.inp_tags]  (em/get-prop :value)
                                                                                                  :auths-val [sel :.cbx_auth]  (em/get-prop :value)
                                                                                                  :auths-c?  [sel :.cbx_auth]  (em/get-prop :checked)
                                                                                                  :cats-val  [sel :.cbx_cat]   (em/get-prop :value)
                                                                                                  :cats-c?   [sel :.cbx_cat]   (em/get-prop :checked))
                                                                                 one-c?  (partial some identity)]
                                                                             (if (and false (one-c? (:cats-c? article)) (one-c? (:auths-c? article)));TODO test title/body
                                                                               (fm/letrem [res (update_article_rem uid
                                                                                                                   (:title article)
                                                                                                                   (:body article)
                                                                                                                   (:tags article)
                                                                                                                   (zipmap (:auths-val article) (:auths-c? article))
                                                                                                                   (zipmap (:cats-val article) (:cats-c? article)))
                                                                                           div (get-page "news-refresh-article-div" uid)]
                                                                                 (em/at js/document
                                                                                        [sel] (em/chain
                                                                                                (em/fade-out 200)
                                                                                                (em/substitute div)
                                                                                                (em/fade-in 200)))
                                                                                 (newspage href args))
                                                                               (js/console.log (str "auths: " (zipmap (:auths-val article) (:auths-c? article)) "cats: " (zipmap (:cats-val article) (:cats-c? article))) )
                                                                               ;(js/alert "Check at least one author and category")
                                                                               ))))))))))));FIXME only refresh the new buttons?

(add-page-init! "news" newspage)
(add-page-init! "blog" newspage)
