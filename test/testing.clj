(ns testing
  (:use [clojure.test]
        [undefined.content :only [str-to-int remove-unsafe-tags]]))

(defn myfixture [block] 
  ;; setup before tests, cleanup after
  (do 
    ;(init)
    (block)
    ;(end)
    ))

(use-fixtures :each myfixture)


(deftest test-str-to-int []
  (doseq [i (range 100)]
    (is (= i (str-to-int (str "haha" i "omg lol <stuff> injeeeection") :nop)))))
