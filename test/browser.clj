(ns browser
  (:require [net.cgrand.enlive-html :as html]) 
  (:use [clojure.test]
        [clj-webdriver.taxi]
        [undefined.content :only [str-to-int remove-unsafe-tags]]))

;; FIXME: for now database has to be prepared (empty) & lein run have to be done manually 
;;        before starting tests.

(def ^:private browser-count (atom 0))

;; http://corfield.org/blog/post.cfm/automated-browser-based-testing-with-clojure
(defn browser-up
  "Start up a browser if it's not already started."
  []
  (when (= 1 (swap! browser-count inc))
    (set-driver! {:browser :firefox})
    (implicit-wait 60000)))

(defn browser-down
  "If this is the last request, shut the browser down."
  [& {:keys [force] :or {force false}}]
  (when (zero? (swap! browser-count (if force (constantly 0) dec)))
    (quit)))

(defn add-browser [block] 
  (do 
    (browser-up)
    (block)
    (browser-down)
    ))

;;(use-fixtures :each add-browser)

;; (deftest test-firefox []
;;   (let [src (do
;;               (to "http://localhost:8000")
;;               (page-source))]
;;     (html/ (as-tree ()))))

(deftest test-page-titles []
  (doseq [page ["news" "blog" "products" "about"]]
    (is (nil? (re-find (re-pattern page)
                       (first (map html/text
                                   (html/select (html/html-resource (java.net.URL. (str "http://localhost:8000/" page)))
                                                [:#title]))))))))
