//package com.corazyarcade.coa_auth_server.global.aop;
//
//import com.corazyarcade.coa_auth_server.global.annotation.DistributedLock;
//import com.corazyarcade.coa_auth_server.global.exception.ApplicationException;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.aspectj.lang.ProceedingJoinPoint;
//import org.aspectj.lang.annotation.Around;
//import org.aspectj.lang.annotation.Aspect;
//import org.aspectj.lang.reflect.MethodSignature;
////import org.redisson.RedissonMultiLock;
////import org.redisson.api.RLock;
////import org.redisson.api.RedissonClient;
//import org.springframework.expression.ExpressionParser;
//import org.springframework.expression.spel.standard.SpelExpressionParser;
//import org.springframework.expression.spel.support.StandardEvaluationContext;
//import org.springframework.stereotype.Component;
//
//import java.lang.reflect.Method;
//import java.util.Arrays;
//
//import static com.corazyarcade.coa_auth_server.global.exception.GlobalErrorCode.LOCK_ACQUISITION_FAILED;
//import static com.corazyarcade.coa_auth_server.global.exception.GlobalErrorCode.LOCK_INTERRUPTED;
//
//@Aspect
//// Redis 연결 오류로 인한 임시 주석처리
//// @Component
//@RequiredArgsConstructor
//@Slf4j
//public class DistributedLockAop {
//
//    private static final String REDISSON_LOCK_PREFIX = "LOCK:";
//
//    //private final RedissonClient redissonClient;
//    private final AopForTransaction aopForTransaction;
//
//    @Around("@annotation(com.corazyarcade.coa_auth_server.global.annotation.DistributedLock)")
//    public Object lock(final ProceedingJoinPoint joinPoint) throws Throwable {
//        log.debug("Start DistributedLock");
//
//        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
//        Method method = signature.getMethod();
//        DistributedLock distributedLock = method.getAnnotation(DistributedLock.class);
//
//        String[] keys = getDynamicValue(signature.getParameterNames(), joinPoint.getArgs(), distributedLock.keys());
//        String prefix = distributedLock.prefix();
//
////        RLock[] locks = getLocks(prefix, keys);
////
////        RedissonMultiLock multiLock = new RedissonMultiLock(locks);
//
//        try {
//            boolean available = multiLock.tryLock(
//                    distributedLock.waitTime(),
//                    distributedLock.leaseTime(),
//                    distributedLock.timeUnit()
//            );
//            if (!available) {
//                throw new ApplicationException(LOCK_ACQUISITION_FAILED, "Failed to get Lock: " + method.getName() + Arrays.toString(keys));
//            }
//            log.debug("Success lock: {}", Arrays.toString(keys));
//            return aopForTransaction.proceed(joinPoint);
//        } catch (InterruptedException e) {
//            Thread.currentThread().interrupt();
//            throw new ApplicationException(LOCK_INTERRUPTED);
//        } finally {
//            try {
//                multiLock.unlock();
//                log.debug("Unlock: {}", Arrays.toString(keys));
//            } catch (IllegalMonitorStateException e) {
//                log.debug("Already unlock: {} {}", method.getName(), keys);
//            }
//        }
//    }
//
//    private String[] getDynamicValue(String[] parameterNames, Object[] args, String[] keys) {
//        ExpressionParser parser = new SpelExpressionParser();
//        StandardEvaluationContext context = new StandardEvaluationContext();
//
//        for (int i = 0; i < parameterNames.length; i++) {
//            context.setVariable(parameterNames[i], args[i]);
//        }
//
//        String[] dynamicKeys = new String[keys.length];
//        for (int i = 0; i < keys.length; i++) {
//            dynamicKeys[i] = parser.parseExpression(keys[i]).getValue(context, String.class);
//        }
//
//        return dynamicKeys;
//    }
//
////    private RLock[] getLocks(String prefix, String[] keys){
////        RLock[] locks =  new RLock[keys.length];
////
////        for (int i = 0; i < locks.length; i++) {
////            String lockKey = REDISSON_LOCK_PREFIX
////                    + (prefix.isEmpty() ? "" : prefix + ":")
////                    + keys[i];
////            locks[i] = redissonClient.getLock(lockKey);
////        }
////
////        return locks;
////    }
//}
