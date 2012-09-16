(ns undefined.misc
  (:require [net.cgrand.enlive-html :as html]))

;; useless debug
(defn doall-recur [s]
  (if (seq? s)
    (do
      (println "seq:" s)
      (doall (map doall-recur
                s)))
    (do
      (println "notseq" (type s))
      s)))
