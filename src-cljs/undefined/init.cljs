(ns undef.init)
        

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; init
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def inits {:any [] :last []})

(defn add-init!
  ([f last]
   (def inits {:last (conj (:last inits) f)
               :any  (:any inits)}))
  ([f]
   (def inits {:any  (conj (:any inits) f)
               :last (:last inits)})))

(defn do-inits []
  (doseq [f (concat (:any inits) (:last inits))]
    (f)))

(set! (.-onload js/window) do-inits)
