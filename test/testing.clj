(ns testing
  (:require [net.cgrand.enlive-html :as html]) 
  (:use [clojure.test]
        [clj-webdriver.taxi]
        [undefined.content :only [str-to-int remove-unsafe-tags]]))


;; needed to test html result:
(defn tree-to-string [tree]
  (apply str (html/emit* tree)))


;;;;;;;;;;;;; Content tests:

(deftest test-str-to-int []
  (doseq [i (range 100)]
    (is (= i (str-to-int (str "haha" i "omg lol <stuff> injeeeection") :nop)))))

(deftest test-unsafe-tags []
  (is (nil? (re-find #"script" (tree-to-string (remove-unsafe-tags "<div> </div> <script>")))))
  (is (nil? (re-find #"script" (tree-to-string (remove-unsafe-tags "<div> <script> </div>")))))
  (is (nil? (re-find #"script" (tree-to-string (remove-unsafe-tags "<div>  <script><div>  <script><div> <script> <div>  <script><div>  <script></div></div></div></div></div> <script>")))))
  (is (nil? (re-find #"script" (tree-to-string (remove-unsafe-tags "<div>  <script><div>  <script></div> <script> </div>  <script></div>  <script></div></div></div></div></div> <script>")))))
  (is (nil? (re-find #"script" (tree-to-string (remove-unsafe-tags "<script><div></script> </div> <script>"))))))
