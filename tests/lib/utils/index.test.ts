import { cn } from '../../../lib/utils';

describe('Utils - cn function', () => {
  test('deve mesclar classes corretamente', () => {
    // Teste com caso de sucesso básico
    expect(cn('class1', 'class2')).toBe('class1 class2');
    
    // Teste com condicionais
    expect(cn('class1', false && 'class2', true && 'class3')).toBe('class1 class3');
    
    // Teste com objeto de condicionais
    expect(cn('class1', { 'class2': true, 'class3': false })).toBe('class1 class2');
    
    // Teste com array de classes
    expect(cn('class1', ['class2', 'class3'])).toBe('class1 class2 class3');
    
    // Teste com duplicação - deve remover duplicatas através do twMerge
    expect(cn('p-4 text-red', 'p-4 text-blue')).toBe('p-4 text-blue');
  });

  // Teste de caso de falha (embora essa função não tenha muitos casos de falha)
  test('deve lidar com entradas vazias', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(undefined)).toBe('');
  });

  // Teste de caso extremo
  test('deve lidar com muitas classes e tipos complexos', () => {
    const result = cn(
      'class1',
      { 'class2': true, 'class3': false },
      ['class4', 'class5'],
      false && 'class6',
      true && 'class7',
      null,
      undefined
    );
    
    expect(result).toBe('class1 class2 class4 class5 class7');
  });
}); 