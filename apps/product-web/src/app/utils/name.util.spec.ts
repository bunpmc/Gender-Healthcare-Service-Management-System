import { NameUtil, DoctorNamePipe, InitialsPipe } from './name.util';

describe('NameUtil', () => {
  describe('formatDoctorName', () => {
    it('should add Dr. prefix to names without it', () => {
      expect(NameUtil.formatDoctorName('John Smith')).toBe('Dr. John Smith');
      expect(NameUtil.formatDoctorName('alice johnson')).toBe('Dr. Alice Johnson');
    });

    it('should not duplicate Dr. prefix', () => {
      expect(NameUtil.formatDoctorName('Dr. John Smith')).toBe('Dr. John Smith');
      expect(NameUtil.formatDoctorName('DR. ALICE JOHNSON')).toBe('DR. ALICE JOHNSON');
      expect(NameUtil.formatDoctorName('dr. bob wilson')).toBe('dr. bob wilson');
    });

    it('should handle edge cases', () => {
      expect(NameUtil.formatDoctorName('')).toBe('Dr. Unknown');
      expect(NameUtil.formatDoctorName(null)).toBe('Dr. Unknown');
      expect(NameUtil.formatDoctorName(undefined)).toBe('Dr. Unknown');
      expect(NameUtil.formatDoctorName('   ')).toBe('Dr. Unknown');
    });

    it('should remove Dr. prefix when includeTitle is false', () => {
      expect(NameUtil.formatDoctorName('Dr. John Smith', false)).toBe('John Smith');
      expect(NameUtil.formatDoctorName('John Smith', false)).toBe('John Smith');
      expect(NameUtil.formatDoctorName('DR. ALICE JOHNSON', false)).toBe('ALICE JOHNSON');
    });

    it('should handle names with extra spaces', () => {
      expect(NameUtil.formatDoctorName('  John Smith  ')).toBe('Dr. John Smith');
      expect(NameUtil.formatDoctorName('  Dr. John Smith  ')).toBe('Dr. John Smith');
    });
  });

  describe('getInitials', () => {
    it('should extract initials correctly', () => {
      expect(NameUtil.getInitials('John Smith')).toBe('JS');
      expect(NameUtil.getInitials('Dr. Alice Johnson')).toBe('AJ');
      expect(NameUtil.getInitials('Mary Jane Watson')).toBe('MJ');
    });

    it('should handle edge cases', () => {
      expect(NameUtil.getInitials('')).toBe('UN');
      expect(NameUtil.getInitials(null)).toBe('UN');
      expect(NameUtil.getInitials(undefined)).toBe('UN');
    });

    it('should respect maxInitials parameter', () => {
      expect(NameUtil.getInitials('John Michael Smith', 3)).toBe('JMS');
      expect(NameUtil.getInitials('John Michael Smith Watson', 2)).toBe('JM');
    });
  });

  describe('hasDoctorPrefix', () => {
    it('should detect Dr. prefix correctly', () => {
      expect(NameUtil.hasDoctorPrefix('Dr. John Smith')).toBe(true);
      expect(NameUtil.hasDoctorPrefix('DR. ALICE JOHNSON')).toBe(true);
      expect(NameUtil.hasDoctorPrefix('dr. bob wilson')).toBe(true);
      expect(NameUtil.hasDoctorPrefix('John Smith')).toBe(false);
      expect(NameUtil.hasDoctorPrefix('')).toBe(false);
      expect(NameUtil.hasDoctorPrefix(null)).toBe(false);
    });
  });
});

describe('DoctorNamePipe', () => {
  let pipe: DoctorNamePipe;

  beforeEach(() => {
    pipe = new DoctorNamePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format doctor names correctly', () => {
    expect(pipe.transform('John Smith')).toBe('Dr. John Smith');
    expect(pipe.transform('Dr. Alice Johnson')).toBe('Dr. Alice Johnson');
    expect(pipe.transform('John Smith', false)).toBe('John Smith');
  });
});

describe('InitialsPipe', () => {
  let pipe: InitialsPipe;

  beforeEach(() => {
    pipe = new InitialsPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should extract initials correctly', () => {
    expect(pipe.transform('John Smith')).toBe('JS');
    expect(pipe.transform('Dr. Alice Johnson')).toBe('AJ');
    expect(pipe.transform('Mary Jane Watson', 3)).toBe('MJW');
  });
});
