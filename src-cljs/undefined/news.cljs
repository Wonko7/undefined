(ns undef.news
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em])
  (:use [undef.pages :only [add-page-init! page-click]]
        [undef.misc :only [restore-height]]))


(defn newspage [href & [args]]
  (letfn [(update-comment-count-li [uid]
            (fm/letrem [link-text (mk-comment-count-rem uid)]
              (em/at js/document [:.comment-count :a] (em/content link-text))))
          
          (submit [type sel uid]
            (letfn [(animate-replace [div]
                      (em/at js/document
                             [sel] (em/chain (em/resize :curwidth 0 200) ;; FIXME might make a function out of this (defn up-down-change-elt [& funs to add to chain])
                                             (em/content div)
                                             (ef/chainable-standard #(em/at %
                                                                            [:.btn_del_c_and_a] (em/listen :click (delete-button type))
                                                                            [:.btn_upd_c_and_a] (em/listen :click (update-button type))
                                                                            [:form.new-comment] (em/listen :submit new-comment)))
                                             (restore-height 200))))]
              (if (= type :article)
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
                    (if (and (one-c? (:cats-c? article)) (one-c? (:auths-c? article))) ;; FIXME test title/body & add tests on server side
                      (fm/letrem [res (update_article_rem uid
                                                          (:title article)
                                                          (:body article)
                                                          (:tags article)
                                                          (zipmap (:auths-val article) (:auths-c? article))
                                                          (zipmap (:cats-val article) (:cats-c? article)))
                                  div (get-page "refresh-article-div" uid)]
                        (animate-replace div))
                      (js/alert "Check at least one author and category"))))
                (fn [e]
                  (.preventDefault e)
                  (let [{:keys [comment]} (em/from js/document :comment [sel :.txt_body] (em/get-prop :value))]
                    (if (re-find #"^\s*$" comment)
                      (js/alert "Your comment is empty...")
                      (fm/letrem [res (update_comment_rem uid comment)
                                  div (get-page "refresh-comment-div" uid)]
                        (animate-replace div)
                        (update-comment-count-li uid))))))))

          (delete-button [type]
            (fn [e]
              (let [uid (em/from (.-currentTarget e) (em/get-attr :value))
                    stype (name type)]
                (when (js/confirm (str "This will PERMANENTLY erase the " stype))
                  (fm/letrem [res (delete_rem type uid)]
                    (em/at js/document [(str "#" stype "_" uid)] (em/chain (em/resize :curwidth 0 200)
                                                                           (em/remove-node)))
                    (when (= type :comment)
                      (update-comment-count-li uid)))))))

          (update-button [type]
            (fn [e]
              (let [uid    (int (em/from (.-currentTarget e) (em/get-attr :value)))
                    stype  (name type)
                    sel    (keyword (str "#" stype "_" uid))]
                (fm/letrem [div (get-page (str "update-" stype "-div") uid)]
                  (em/at js/document
                         [sel] (em/chain (em/resize :curwidth 0 200)
                                         (em/html-content div)
                                         (ef/chainable-standard #(em/at % [:form] (em/listen :submit (submit type sel uid))))
                                         (restore-height 200)))))))

          (new-comment [e]
            (.preventDefault e)
            (let [form       [(.-currentTarget e)]
                  {:keys [body id]} (em/from form
                                             :id   [:.btn_add_comment] (em/get-attr :data-article-id)
                                             :body [:textarea]         (em/get-prop :value))]
              (if (re-find #"^\s*$" body)
                (js/alert "Your comment is empty.")
                (if (> (.length body) 10000)
                  (js/alert "Your comment cannot be more than 10000 characters long.")
                  (do
                    (fm/letrem [res (insert_comment_rem id body)
                                div (get-page "fetch-comment-div" res)]
                    (update-comment-count-li res)
                      (em/at form [:textarea] (em/set-prop :value ""))
                      (em/at form (em/before div))
                      (em/at js/document [(str "#comment_" res)] (em/chain (em/resize :curwidth 0 0)
                                                                           (em/remove-class "hidden")
                                                                           (ef/chainable-standard #(em/at %
                                                                                                          [:.btn_del_c_and_a] (em/listen :click (delete-button :comment))
                                                                                                          [:.btn_upd_c_and_a] (em/listen :click (update-button :comment))))
                                                                           (restore-height 200)))))))))]

    (em/at js/document
      [:.btn_del]         (em/listen :click (delete-button :article))
      [:.btn_upd]         (em/listen :click (update-button :article))
      [:.btn_del_comment] (em/listen :click (delete-button :comment))
      [:.btn_upd_comment] (em/listen :click (update-button :comment))
      [:form.new-comment] (em/listen :submit new-comment))))


(add-page-init! "news" newspage)
